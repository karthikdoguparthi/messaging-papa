# 📱 Private Messenger Web App — Complete Features Guide

A modern, private, mobile-first messaging platform designed exclusively for a closed circle of friends. Built on a **₹0 Free-First Architecture** with **Zero AI Dependencies**, **Zero Paid Third-Party APIs**, and client-side **End-to-End Encryption (E2EE)**.

---

## 🛡️ 1. Architecture & Cost Principles (₹0 Free-First)
- **Firebase Spark Free Tier**: Configured exclusively for Google's $0/month Spark plan without Blaze billing or hidden credit card requirements.
- **Client Multi-Tab Firestore Offline Cache**: Implements `persistentLocalCache` with `persistentMultipleTabManager` to minimize Firestore read counts.
- **Index-Free Query Architecture**: Formulated single-field queries without requiring complex compound indices in Firestore.
- **Zero AI / Zero External Paid APIs**: 100% text-focused, human-only messaging with no LLMs, analytics trackers, or paid services.
- **Vercel & Firebase Hosting Ready**: Includes single-page client-side rewrite configurations (`vercel.json` and `firebase.json`).

---

## 🔐 2. Authentication & Closed Membership System
- **Google One-Click Authentication**: Secure login using Google identity provider through Firebase Auth.
- **Invite-Only / Gatekeeper Pipeline**: Newly signed-up users default to a `pending` account status.
- **Self-Approval Prevention**: Firestore Security Rules strictly prohibit users from approving their own account status.
- **Suspension Enforcement**: Blocked accounts are immediately cut off from viewing conversations, member profiles, or sending messages.
- **Instant Demo Evaluation Sandbox**: Built-in multi-persona switcher for local development and testing before connecting production Firebase credentials.

---

## 🔒 3. End-to-End Encryption (E2EE)
- **Web Crypto API Standard**: Zero third-party cryptographic dependencies; utilizes native browser cryptography.
- **AES-GCM 256-bit Encryption**: Text messages are encrypted with unique initialization vectors (IVs) on the client before being sent.
- **PBKDF2 Key Derivation**: Cryptographic channel keys derived using SHA-256 and 100,000 iterations over deterministic channel identifiers.
- **In-Memory Decryption**: Only authenticated and authorized members of that chat can decrypt and read the message text.
- **Visual E2EE Badge**: A green lock icon (`🔒`) in the chat header indicates active channel encryption.

---

## 👤 4. Profiles & Username Discovery
- **Unique Username Reservations**: Enforced atomic uniqueness reservations under the `usernames/{usernameLower}` collection.
- **Privacy Guarantee**: Email addresses are never made public, exposed in responses, or searchable by other users.
- **Case-Insensitive `@username` Discovery**: Fast search to find approved circle members (e.g. `@venkatsiddu`, `@karthik`).
- **Profile Customization**: Members can customize display names, bios, and profile avatars anytime in Settings.
- **Discoverability Toggle**: Users can toggle off their discoverability if they prefer to remain hidden from username searches.

---

## 🤝 5. Friends System
- **Mutual Friend Requests**: Direct conversations require an established friendship before messages can be exchanged.
- **Request Management**: Send, receive, accept, decline, and cancel pending friend requests in real time.
- **Dedicated Friends Tab**: View all accepted friends with online presence badges.
- **Quick "+ New Chat" Action**: One-click button in the conversation sidebar to start messaging any friend directly.
- **Cascading Friend Removal**: Removing a friend automatically removes their conversation thread and closes open windows.

---

## 💬 6. Real-Time Private Messaging
- **Instant Messaging**: Real-time message delivery powered by Firestore snapshot listeners.
- **Stable WhatsApp-Style Conversation Ordering**: Sending a message automatically moves that chat to the top of the conversation list with a message preview snippet.
- **Reply Quotes**: Reply directly to any message with an attached reference quote preview.
- **Message Editing**: Sender can edit their sent messages with a visible `(edited)` timestamp tag.
- **Soft Deletion**: Secure message deletion that replaces content with a *"This message was deleted"* notice.
- **Emoji Reactions**: Interactive emoji reactions (`❤️`, `👍`, `🔥`, `😂`, `🎉`, `😮`) with member reaction counts.
- **Read Receipts**: Subtle delivery and read checks (`✓✓`).
- **Direct Conversation Deletion**: Hover-to-delete trash icon (`🗑️`) on conversation rows to delete chats on demand.

---

## 🟢 7. Presence & Notifications
- **Lightweight Presence System**: Touch-based `lastSeenAt` heartbeats that keep database writes low while showing "Active now" vs "Offline".
- **In-App Notifications**: Real-time bell notifications for new friend requests, accepted friendships, and incoming messages.

---

## 🛡️ 8. Moderation & Admin Dashboard
- **Dedicated Admin Governance View**:
  - **Approvals Tab**: Approve or block pending user registrations.
  - **Members Tab**: View all registered users and manage active/suspended states.
  - **Reports Tab**: Review flagged accounts with detailed incident reports.
- **Member Blocking**: Block any user to immediately prevent friend requests and conversations.
- **In-App Reporting**: Report inappropriate behavior, spam, harassment, or impersonation directly to administrators.

---

## 📱 9. Modern UI & Responsive Design
- **Dark Mode Aesthetic**: Minimalist deep charcoal palette (`#0a0d14`), soft gray glass panels, and vibrant indigo accents.
- **Mobile-First Experience**: 
  - Desktop: Multi-column view (Nav rail + Conversation list + Active chat).
  - Mobile: Native bottom tab bar navigation with full-screen chat views and back navigation.
- **Custom Minimal Scrollbars & Animations**: Polished transitions powered by Tailwind CSS v4 and Framer Motion.
