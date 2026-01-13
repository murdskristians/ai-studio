# AI Studio - Project Overview

## What We're Using

| Technology | What For |
|------------|----------|
| **React 19** | UI framework - builds the interface |
| **TypeScript** | Type safety - catches bugs before runtime |
| **Vite** | Build tool - fast dev server and bundling |
| **pnpm** | Package manager - installs dependencies |
| **@google/generative-ai** | Gemini API SDK - talk to Google's AI |
| **groq-sdk** | Groq API SDK - talk to Groq's fast AI |
| **react-markdown** | Render AI responses with formatting |
| **uuid** | Generate unique IDs for messages/bots |
| **localStorage** | Save data in browser - no server needed |

## Why No Database (For Now)

**We don't need a database because:**

1. **All data stays in the browser** - API keys, bots, chat history are saved to localStorage
2. **No user accounts** - single user per browser, no login needed
3. **No sharing** - bots and chats are personal, not shared between users
4. **Simpler deployment** - just static files, host anywhere (Vercel, Netlify, GitHub Pages)
5. **Privacy** - user data never leaves their computer (except API calls to AI providers)
6. **Faster development** - no backend code, no database setup, no server costs

**When would we need a database?**
- User accounts and login
- Share bots between users
- Sync across devices
- Team/organization features
- Usage analytics

## How Data is Stored

```
localStorage keys:
├── ai-studio-settings     → API keys, theme, defaults
├── ai-studio-bots         → Array of bot configurations
├── ai-studio-conversations → Array of chat histories
```

## Project Structure (Simplified)

```
src/
├── components/     → UI pieces (buttons, chat, sidebar)
├── contexts/       → Global state (AppContext.tsx)
├── services/
│   ├── providers/  → AI API integrations (Gemini, Groq, OpenRouter)
│   └── storage/    → localStorage wrapper
├── types/          → TypeScript interfaces
├── constants/      → Model list
└── App.tsx         → Main app
```

## How It Works

1. **User opens app** → Load saved data from localStorage
2. **User sends message** → Call AI provider API with streaming
3. **AI responds** → Stream text to screen in real-time
4. **Conversation saved** → Auto-save to localStorage
5. **User creates bot** → Save config to localStorage
6. **User exports bot** → Download as JSON file
7. **User imports bot** → Upload JSON, save to localStorage
