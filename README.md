# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# ai-studio-module

## Getting started

```bash
pnpm install
cp .env.example .env    # then fill in GROQ_API_KEY
pnpm dev                # http://localhost:3002
```

`pnpm dev` serves the UI only. To exercise the demo proxy as well, run
`netlify dev`, which also runs `netlify/functions/` and loads `.env`.

## API keys

The app talks to Groq two ways, and needs neither configured to run:

| | Key used | Where it lives |
|---|---|---|
| Visitor saves a key in Settings | theirs | their browser's localStorage; calls Groq directly |
| Visitor saves nothing | `GROQ_API_KEY` | the server, via `netlify/functions/groq-chat.mts` |

With no `GROQ_API_KEY` set, the function returns 503 and the UI asks the
visitor for their own key — the app degrades, it does not break.

**`GROQ_API_KEY` is server-side only.** Set it in Netlify's environment
variables for the deployed site, and in `.env` locally — that is the file
`netlify dev` hands to the functions. It does not belong in `.env.development`
or `.env.production`, which are read by webpack rather than by the function
that needs it.

Those two webpack files only ever expose a value if some file under `src/`
writes `process.env.NAME`; DefinePlugin substitutes references, it does not
copy the file into the bundle. Nothing in `src/` reads any env var today. So
the rule that keeps the key private is simply: don't reference it from client
code. See [.env.example](.env.example) for the full breakdown.
