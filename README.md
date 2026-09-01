# Rain Letters

Rain Letters is a private, interactive two-person web experience built around rain, flowers, shared messages, and a custom garden world.

It uses React, TypeScript, Vite, Three.js, Supabase, Framer Motion, and CSS custom styling.

## Overview

The app includes:
- a procedural 3D rain environment
- a personalized landing page and name gate
- Google login through Supabase Auth
- private real-time messaging
- presence indicators and arrival notifications
- a shared garden growth system
- simple browser games

## Tech Stack
- React 19
- TypeScript
- Vite
- Three.js / React Three Fiber
- Supabase
- Framer Motion

## Project Structure

```bash
rain-letters/
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json
├── .env.example
├── README.md
├── supabase/
│   └── migration.sql
├── public/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── scenes/
│   └── styles/
└── dist/
```

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
npm install
```

### Run locally
```bash
npm run dev
```

Open `http://localhost:5173`.

## Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Setup

1. Create a project in Supabase.
2. Copy the project URL and anon key from Project Settings > API.
3. Run the SQL in `supabase/migration.sql` in the Supabase SQL editor.
4. Configure Google OAuth in Supabase Authentication > Providers.
5. Add your Vercel domain in the redirect URLs.

## Vercel Deployment

The project is configured for Vercel and includes a `vercel.json` rewrite for SPA routing.

Deployment command:
```bash
npx vercel --prod --yes
```

## Security Notes

This app uses client-side access checks plus server-side Supabase RLS and allowlist enforcement.

## License

This project is intended for private use and personal deployment.


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
