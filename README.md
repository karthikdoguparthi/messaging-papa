# Private Messenger Web App (Free-First Architecture)

A minimal, private, mobile-first messaging web application built for a closed circle of friends, strictly following the ₹0 Free Spark tier specification with zero paid APIs, no AI dependencies, and hardened Firestore Security Rules.

---

## 🚀 Key Architectural Highlights

1. **Free-First Stack**:
   - **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion + Lucide Icons.
   - **Backend / Database**: Cloud Firestore + Firebase Authentication (Google Sign-In) + Firebase App Check + Firebase Hosting.
   - **Quota & Cost Optimizations**:
     - Client multi-tab persistent Firestore offline cache (`persistentLocalCache`) to avoid repetitive document read charges.
     - Deterministic friendship and chat document IDs (`chat_uid1_uid2`) avoiding duplicate documents and scans.
     - Paginated and limited queries (`limit(25)` for chats, `limit(50)` for message logs, `limit(10)` for username searches).
     - Lightweight presence heartbeat (touching `lastSeenAt` timestamp every 2 minutes rather than persistent high-write ping loops).

2. **Private Membership & Invite-Only Flow**:
   - Newly authenticated users receive a `pending` status by default.
   - Self-approval is explicitly prohibited by Firestore Security Rules (`accountStatus` cannot be modified by non-admin users).
   - Only approved members can discover usernames, send friend requests, and start direct chats.
   - Suspended/blocked users are immediately blocked from reading or writing messages.

3. **Privacy & Security**:
   - No emails are exposed or searchable; discovery occurs exclusively through unique `@usernames`.
   - Complete rules set in `firestore.rules` verifying chat membership, sender authenticity, and administrative permissions.
   - In-app reporting and member blocking controls.

---

## 🛠️ Local Development & Testing

The application includes an **instant demo/preview sandbox** so you can test all features (admin approval, pending states, friend requests, real-time messaging, emoji reactions) right away even before adding Firebase keys.

### 1. Install & Run
```bash
npm install
npm run dev
```

### 2. Connect to Your Firebase Spark Project
1. Create a project at [Firebase Console](https://console.firebase.google.com/) (select Spark Free Plan).
2. Enable **Authentication** -> **Google Sign-In**.
3. Enable **Cloud Firestore** in production mode.
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Fill in your Firebase config keys in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_INITIAL_ADMIN_EMAIL=your-google-email@gmail.com
   ```

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Deploy to Firebase Hosting (₹0 Free Tier)
```bash
npm run build
firebase deploy --only hosting
```

