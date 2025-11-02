# What The Chant? 📣

A React-based web application for browsing and managing protest chants. Find the perfect chants for your next demonstration!

## Features

- **Browse Chants**: Search through categorized protest chants
- **Favorites**: Save your favorite chants locally
- **Categories**: Filter by Palestine, Stop the War, Stop Ulez Right, Workers Rights, and more
- **Search**: Fuzzy search functionality to find specific chants
- **Lock Feature**: Protect your favorites with a simple lock
- **Submit Chants**: Contribute new chants via email submission
- **Authentication** (Optional): Sign in with email/password or Google OAuth
- **Dark/Light Theme**: Toggle between themes based on preference
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- React 18 + TypeScript
- Material-UI (MUI) for components and theming  
- Vite for development and building
- Supabase for optional authentication
- AWS API Gateway + Lambda for chant submissions
- Local Storage for data persistence

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd what-the-chant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Optional: Configure Authentication**
   - Copy `.env.example` to `.env.local`
   - Create a [Supabase](https://supabase.com) project
   - Add your Supabase URL and anon key to `.env.local`
   - Authentication features will be disabled without these variables

## Environment Variables

The app works without any environment variables, but you can enable additional features:

```env
# Optional: Supabase authentication
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AWS API Gateway for chant submissions  
VITE_API_URL=your_aws_api_gateway_url
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (AuthContext)
├── features/           # Feature-based organization
│   ├── auth/          # Authentication components
│   ├── chantList/     # Chant browsing and management
│   └── chantSubmission/ # Chant submission form
├── lib/               # External service configurations
└── theme/             # Material-UI theme configuration
```

## Authentication Features

The app includes optional Supabase authentication:
- **Sign Up/Sign In**: Email/password and Google OAuth
- **Auto-fill Forms**: Authenticated users get pre-filled submission forms
- **Profile Management**: User avatar and sign-out functionality
- **Graceful Degradation**: App works fully without authentication

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Development Notes

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
