import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  getDocs 
} from 'firebase/firestore';
import { db, isDemoMode } from '../lib/firebase';
import { Chat, ChatMessage, UserProfile } from '../types';
import { mockStore } from './mockStore';
import { encryptMessage, decryptMessage } from '../lib/crypto';

export const chatService = {
  // Deterministic chat ID based on two user IDs
  getChatId(uid1: string, uid2: string): string {
    return `chat_${[uid1, uid2].sort().join('_')}`;
  },

  // Start or get existing direct chat
  async getOrCreateChat(currentUid: string, targetUid: string): Promise<string> {
    const chatId = this.getChatId(currentUid, targetUid);

    if (isDemoMode) {
      const existing = mockStore.chats.find(c => c.id === chatId || (c.members.includes(currentUid) && c.members.includes(targetUid)));
      if (existing) {
        return existing.id;
      }
      mockStore.chats.unshift({
        id: chatId,
        type: 'direct',
        members: [currentUid, targetUid],
        createdAt: Date.now(),
        createdBy: currentUid,
        unreadCount: 0,
      });
      mockStore.messages[chatId] = [];
      mockStore.notify();
      return chatId;
    }

    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDocs(query(collection(db, 'chats'), where('members', 'array-contains', currentUid), limit(50)));
    const found = snap.docs.find(d => d.id === chatId || (d.data().members?.includes(currentUid) && d.data().members?.includes(targetUid)));

    if (!found) {
      await setDoc(chatRef, {
        type: 'direct',
        members: [currentUid, targetUid],
        createdAt: Date.now(),
        createdBy: currentUid,
        lastMessageText: '',
        lastMessageAt: Date.now(),
        lastMessageSenderUid: '',
      });
      return chatId;
    }

    return found.id;
  },

  // Subscribe to user's conversation list (paginated/limited for free tier optimization)
  subscribeUserChats(uid: string, callback: (chats: Chat[]) => void) {
    if (isDemoMode) {
      const update = () => {
        const chats = mockStore.chats
          .filter(c => c.members.includes(uid))
          .map(c => {
            const otherUid = c.members.find(m => m !== uid) || uid;
            const otherMember = mockStore.users.find(u => u.uid === otherUid);
            return { ...c, otherMember };
          })
          .sort((a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt));
        callback(chats);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
      limit(25)
    );

    return onSnapshot(q, async (snap) => {
      const chats = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
      // Populate other member's profile for display
      for (const chat of chats) {
        const otherUid = chat.members.find(m => m !== uid);
        if (otherUid) {
          const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', otherUid), limit(1)));
          if (!userSnap.empty) {
            chat.otherMember = userSnap.docs[0].data() as UserProfile;
          }
        }
      }
      callback(chats);
    });
  },

  // Subscribe to messages within a chat with automatic E2EE decryption
  subscribeMessages(chatId: string, callback: (messages: ChatMessage[]) => void, messageLimit = 50) {
    const decryptList = async (rawMsgs: ChatMessage[]) => {
      const decrypted = await Promise.all(
        rawMsgs.map(async (msg) => {
          const plain = await decryptMessage(chatId, msg.text);
          return { ...msg, text: plain };
        })
      );
      callback(decrypted);
    };

    if (isDemoMode) {
      const update = () => {
        const msgs = (mockStore.messages[chatId] || []).slice(-messageLimit);
        decryptList(msgs);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    );

    return onSnapshot(q, (snap) => {
      const messages = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ChatMessage))
        .reverse();
      decryptList(messages);
    });
  },

  // Send an End-to-End Encrypted text message
  async sendMessage(
    chatId: string, 
    senderUid: string, 
    text: string, 
    replyToMessage?: { id: string; text: string; senderName: string }
  ) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Encrypt message text before storing or dispatching
    const encryptedText = await encryptMessage(chatId, trimmed);

    if (isDemoMode) {
      if (!mockStore.messages[chatId]) {
        mockStore.messages[chatId] = [];
      }
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        senderUid,
        type: 'text',
        text: encryptedText,
        createdAt: Date.now(),
        replyToMessageId: replyToMessage?.id,
        replyToMessage: replyToMessage ? { text: replyToMessage.text, senderName: replyToMessage.senderName } : undefined,
      };
      mockStore.messages[chatId].push(newMsg);

      // Update chat last message preview (stored encrypted or locked indicator)
      const chat = mockStore.chats.find(c => c.id === chatId);
      if (chat) {
        chat.lastMessageText = trimmed;
        chat.lastMessageAt = Date.now();
        chat.lastMessageSenderUid = senderUid;
      }
      mockStore.notify();
      return newMsg;
    }

    const messageData = {
      senderUid,
      type: 'text',
      text: encryptedText,
      createdAt: Date.now(),
      replyToMessageId: replyToMessage?.id || null,
      replyToMessage: replyToMessage ? { text: replyToMessage.text, senderName: replyToMessage.senderName } : null,
      reactions: {}
    };

    // Add encrypted message to Firestore
    const msgRef = await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

    // Update parent chat preview
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessageText: trimmed,
      lastMessageAt: Date.now(),
      lastMessageSenderUid: senderUid
    });

    return { id: msgRef.id, ...messageData, text: trimmed };
  },

  // Edit own message (re-encrypts)
  async editMessage(chatId: string, messageId: string, newText: string) {
    const trimmed = newText.trim();
    if (!trimmed) return;

    const encrypted = await encryptMessage(chatId, trimmed);

    if (isDemoMode) {
      const msgs = mockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        msg.text = encrypted;
        msg.editedAt = Date.now();
        mockStore.notify();
      }
      return;
    }

    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      text: encrypted,
      editedAt: Date.now()
    });
  },

  // Soft delete message
  async deleteMessage(chatId: string, messageId: string) {
    if (isDemoMode) {
      const msgs = mockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        msg.deletedAt = Date.now();
        msg.text = 'This message was deleted';
        mockStore.notify();
      }
      return;
    }

    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      deletedAt: Date.now(),
      text: 'This message was deleted'
    });
  },

  // Toggle emoji reaction
  async toggleReaction(chatId: string, messageId: string, emoji: string, uid: string) {
    if (isDemoMode) {
      const msgs = mockStore.messages[chatId] || [];
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        const currentList = msg.reactions[emoji] || [];
        if (currentList.includes(uid)) {
          msg.reactions[emoji] = currentList.filter(u => u !== uid);
          if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        } else {
          msg.reactions[emoji] = [...currentList, uid];
        }
        mockStore.notify();
      }
      return;
    }

    const msgDoc = doc(db, 'chats', chatId, 'messages', messageId);
    // In production, update reactions dictionary
    // We update via snapshot or direct doc read & update
    const snap = await getDocs(query(collection(db, 'chats', chatId, 'messages'), where('__name__', '==', messageId)));
    if (!snap.empty) {
      const data = snap.docs[0].data() as ChatMessage;
      const reactions = { ...(data.reactions || {}) };
      const current = reactions[emoji] || [];
      if (current.includes(uid)) {
        reactions[emoji] = current.filter(u => u !== uid);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...current, uid];
      }
      await updateDoc(msgDoc, { reactions });
    }
  }
};

