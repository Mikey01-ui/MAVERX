# nheion (admin dashboard)

Operation OMNI admin dashboard — lives in this monorepo next to `web/` (the game).

Built with React, Vite, TypeScript, Tailwind CSS, and GSAP.

## Getting started

```bash
# from repo root
cd nheion
npm install
cp .env.example .env   # point at the game API
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Run the game (`web/`) on port 3000 first so invites/accounts APIs respond.

### Environment
- `VITE_OMNI_API_URL` — game/API base (e.g. `http://localhost:3000`)
- `VITE_OMNI_GAME_URL` — game front-end URL
- `VITE_DASHBOARD_API_KEY` — must match `DASHBOARD_API_KEY` in `web/.env`

### Build
```bash
npm run build
npm run preview
```
