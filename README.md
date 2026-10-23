# AI Resume Builder and Interactive Portfolio

A React + Vite project that collects a user's profile details and presents them in an interactive, desktop-inspired portfolio. It is designed as a frontend academic project and stores portfolio data locally in the browser.

## Features

- Profile form with name, email, biography, education, skills and experience.
- Profile image upload with file validation, resizing and preview.
- Add and remove project cards, with descriptions and technology lists.
- LinkedIn, GitHub, Instagram and Behance links.
- Local browser persistence using `localStorage` and migration of the original flat prototype data.
- Interactive portfolio desktop with Education, Skills, Resume, Projects, Experience and Contact windows.
- macOS-inspired window controls: drag, close, minimize and maximize/restore.
- Social dock and a dock for minimized windows.
- Template-generated presentation script based only on the user's saved details. This is a local demo feature, not a call to a real AI model.
- Responsive layout and keyboard-accessible portfolio icons.

## Requirements

- Node.js 20.19+ or 22.12+ recommended for the installed Vite major version.
- npm.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Verify before submission

```bash
npm run lint
npm run build
```

## Project structure

```text
src/
  components/Window.jsx       Draggable desktop window component
  hooks/usePortfolioData.js   Reads saved portfolio data
  pages/FormPage.jsx          Profile builder form
  pages/PortfolioPage.jsx     Interactive portfolio desktop
  services/schema.js          Data shape and normalization
  services/migrations.js      Legacy data migration
  services/storage.js         Safe localStorage read/write helpers
  services/ai/                AI service boundary and transparent demo adapter
  utils/image.js              Profile image validation and resizing
  index.css                   Application styling
  App.jsx                     Routes
  main.jsx                    React entry point
public/
  bg.jpg                      Portfolio avatar artwork
  images/                     Floating portfolio section icons
  icons/                      Social network icons
```

## Data and privacy

The current version stores profile data in the browser's local storage. It does not require an account or send profile data to a server. Clearing browser site data may remove the saved portfolio. Uploaded profile images are resized before being saved.

## AI integration status

The application has an AI service boundary and a local, template-based presentation-script demo. Real model-based writing, speech synthesis, and talking-avatar video generation are **not configured** in this frontend-only build. Any future provider API key must be stored on a server, never in a `VITE_` environment variable or browser code.

## Known limitations

- The generated portfolio is currently rendered inside the app at `/portfolio`; it is not yet exported as a separate hosted website.
- There is no backend or user authentication.
- The presentation script is template-generated, not model-generated.
- Real AI avatar and voice services require a backend and a configured provider.
