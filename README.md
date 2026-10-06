# 🌱 AI Plant Doctor (PlantCare AI) — Frontend

Static frontend (HTML/CSS/JS, no build step) for GitHub Pages. It talks to the PlantCare backend for accounts, saved data, AI diagnosis and the AI assistant.

```
AI-plant-doctor/
├── index.html   style.css   script.js
├── images/      assets/icons/
└── README.md    .gitignore
```

## Go live (2 parts)
**1. Backend (Render/Railway/Fly)** — deploy the `plantcare-backend` repo (see its README). Set env vars `ANTHROPIC_API_KEY`, `JWT_SECRET`, `NODE_ENV=production`, and `ALLOWED_ORIGIN=https://YOURNAME.github.io`. Copy the backend URL.

**2. Frontend (GitHub Pages)**
1. Open `script.js` and set `const API_BASE = 'https://your-backend.onrender.com';`
2. Push this folder to a GitHub repo.
3. Repo → Settings → Pages → Branch `main`, folder `/ (root)` → Save.
4. Your site: `https://YOURNAME.github.io/REPO-NAME/`

## Features
AI leaf diagnosis (confidence, severity, symptoms, treatment, "consult an expert") · live weather with opt-in location · soil-aware smart watering · AI plant assistant · health timeline and history · accounts that sync across browsers.

Note: the login token is kept in the browser's localStorage. Free backend hosts may take ~30–60 s to wake on the first visit.
