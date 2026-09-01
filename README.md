# 🌧 RAIN LETTERS — PRATIMA

A private, production-ready interactive website and digital world made for two people. Themed around **rain, grass, flowers, personal messages, and two people connecting**.

Built with **React 19, TypeScript, Three.js (React Three Fiber), Supabase (Auth, Postgres, Realtime), Framer Motion, and Vanilla CSS**.

---

## 🌟 Features Overview

1. **Procedural 3D Rain World**:
   - WebGL scene with instanced particle rain (`Three.js Points`), instanced grass blades (`InstancedMesh`), procedural blooming flowers, fog/mist, occasional distant lightning, and glowing fireflies.
   - Low/Medium/High quality settings system automatically detected based on device capabilities.
   - Respects `prefers-reduced-motion`.

2. **Landing Experience & Date-Based Greetings**:
   - Checks local user date: On **September 22**, displays **"HAPPY BIRTHDAY PRATIMA"** with animated petals and golden glow.
   - On all other dates: Rotates through 17 original playful compliments without repeating consecutive items (remembers state in `localStorage`).
   - Mouse parallax effect & letter-by-letter stagger entrance.

3. **Name Entry Gate & Google Authentication**:
   - Case-insensitive name gate accepting: `pratima`, `tima`, `xyz`, `sachin`, `sapy`.
   - Real Google OAuth integration via Supabase Auth.
   - Server-side email allowlist enforced via Supabase Row Level Security (RLS) policies and PostgreSQL triggers.
   - Allowed accounts:
     - `pratimahansda14@gmail.com`
     - `pratimahansda18@gmail.com`
     - `praticreates@gmail.com`
     - `sachin.artspace@gmail.com`
     - `sachingupta706155@gmail.com`
     - `sachingupta766741@gmail.com`

4. **Real-Time Private World & Messaging**:
   - Translucent glassmorphism floating message cards integrated into the rainy night environment.
   - Instant real-time message delivery via Supabase Realtime subscriptions.
   - Environment rain intensity briefly surges on sending messages.
   - Persistent message history stored permanently (no user-facing delete/edit options).

5. **Presence & Arrival Notifications**:
   - Real-time online/offline indicators and typing indicators ("Pratima is typing...").
   - Toast notification when the second user logs into the garden ("🌧 Pratima just arrived").
   - Environment transitions when both users are online (rain becomes softer, flower growth activates).

6. **Shared Persistent Garden Growth**:
   - Field of flowers grows gradually based on **accumulated shared active conversation time** (when both users are online together).
   - Growth progress (0–100%) stored in Supabase database and persists across reloads and sessions.

7. **Mini Games**:
   - **Tic Tac Toe**: Raindrops (💧) vs Flowers (🌼) with winning bloom animations.
   - **Rain Shield**: Original Neal.fun-inspired 2D Canvas mini-game — control an umbrella to shield a flower from dynamic rain and changing wind.

8. **Memories Placeholder Architecture**:
   - Extensible grid ready for future photos, audio recordings, dates, and letters.

---

## 📁 Folder Structure

```
rain-letters/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── .env.example
├── README.md
├── supabase/
│   └── migration.sql           # Database schema, allowlist, RLS policies, triggers
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css                # Design system (CSS Custom Properties)
    ├── vite-env.d.ts
    ├── data/
    │   └── compliments.ts       # Editable compliments, birthday config, allowlist
    ├── lib/
    │   ├── supabase.ts          # Supabase client
    │   ├── auth.ts              # Google OAuth helpers
    │   ├── database.ts          # Postgres queries
    │   ├── presence.ts          # Realtime Presence channels
    │   └── realtime.ts          # Realtime Postgres change subscriptions
    ├── hooks/
    │   ├── useAuth.ts           # Auth state & session persistence
    │   ├── useMessages.ts       # Realtime chat messages
    │   ├── usePresence.ts       # Online status & typing indicators
    │   ├── useGarden.ts         # Shared garden growth timer
    │   ├── useCompliment.ts     # Compliment rotation / Birthday trigger
    │   ├── useSound.ts          # Audio preference
    │   ├── useQuality.ts        # Performance quality auto-detection
    │   └── useReducedMotion.ts  # Accessibility motion preference
    ├── contexts/
    │   ├── AuthContext.tsx       # Auth provider
    │   ├── WeatherContext.tsx    # Weather state provider
    │   └── GardenContext.tsx     # Shared garden state provider
    ├── scenes/
    │   ├── RainWorld.tsx         # Main 3D scene composition
    │   ├── RainSystem.tsx        # Instanced particle rain (GLSL Shaders)
    │   ├── GrassSystem.tsx       # Instanced grass blades
    │   ├── FlowerSystem.tsx      # Procedural blooming flowers
    │   ├── FogSystem.tsx         # Atmospheric fog
    │   ├── LightningSystem.tsx   # Distant lightning flash
    │   ├── FireflySystem.tsx     # Floating fireflies
    │   └── MoonLight.tsx         # Scene lighting
    ├── components/
    │   ├── landing/              # Landing page, GreetingText, NameEntry, GoogleLoginPrompt
    │   ├── auth/                 # AuthCallback, AccessDenied, ProtectedRoute
    │   ├── private/              # PrivateWorld, ChatView, MessageBubble, TypingIndicator, PresenceBar, SideMenu, GardenView, MemoriesView, SettingsView
    │   ├── games/                # GamesMenu, TicTacToe, RainShield
    │   ├── layout/               # RainCanvas, ThemedLoader, PageTransition
    │   └── ui/                   # SoundToggle
    └── styles/
        ├── landing.css
        ├── chat.css
        ├── games.css
        └── transitions.css
```

---

## ⚡ Local Development Setup

### 1. Prerequisites
- Node.js 18+ and `npm`.

### 2. Installation
```bash
git clone <repository-url>
cd rain-letters
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🛠 Database & Authentication Setup (Supabase)

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project.
3. Obtain your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from **Project Settings > API**.

### Step 2: Run Database Migration
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Paste and run the entire contents of `supabase/migration.sql`.
3. This creates:
   - `allowed_emails` table with the authorized emails.
   - `profiles`, `messages`, `garden`, and `presence` tables.
   - `is_allowed_user()` security definer function.
   - Server-side Row Level Security (RLS) policies enforcing allowlist checks.
   - `handle_new_user()` trigger for automatic profile creation.
   - Realtime publication setup for `messages`, `garden`, and `presence`.

### Step 3: Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create an **OAuth 2.0 Client ID** (Web Application).
3. Add Authorized Redirect URI:
   `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret.
5. In Supabase Dashboard: Go to **Authentication > Providers > Google**.
6. Enable Google, paste the Client ID and Client Secret, and save.
7. Under **Authentication > URL Configuration**:
   - Set **Site URL** to `http://localhost:5173` (or your production Vercel URL).
   - Add Redirect URL: `http://localhost:5173/auth/callback` and `https://your-domain.vercel.app/auth/callback`.

---

## 🎨 Customization Guide

### How to Add More Compliments
Edit `src/data/compliments.ts`:
```typescript
export const compliments: string[] = [
  'PRATIMA VERY STRONG',
  'PRATIMA CAN MAKE A 6 FOOT DERFUTYA',
  // Add your new compliment here!
  'PRATIMA IS THE CHAMPION',
];
```

### How to Add Authorized Email Addresses
1. Add to `src/data/compliments.ts` (client pre-check).
2. Insert into the Supabase database table `allowed_emails`:
```sql
INSERT INTO allowed_emails (email, display_name)
VALUES ('new.email@gmail.com', 'Display Name');
```

### How to Tune Birthday Greeting Text / Date
Edit `src/data/compliments.ts`:
```typescript
export const birthdayConfig = {
  month: 9, // September (1-indexed)
  day: 22,
  name: 'PRATIMA',
  greeting: 'HAPPY BIRTHDAY',
};
```

### How to Add Memories
Edit `src/components/private/MemoriesView.tsx` to add memory cards with photos, text, or dates.

### How to Tune Rain & Garden Growth
- **Rain particle counts**: Adjusted in `src/scenes/RainWorld.tsx` under `settings`.
- **Garden growth rate**: Adjusted in `src/hooks/useGarden.ts` (default: ~0.33% growth per minute of shared online presence).

---

## 🚀 Production Deployment (Vercel)

1. Push your repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set environment variables in Vercel settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy! `vercel.json` already contains SPA rewrite rules.
5. Update Google Cloud Console and Supabase Auth Redirect URLs with your Vercel domain (`https://<project-name>.vercel.app/auth/callback`).

---

## 📄 License

Private personal project. All rights reserved.
