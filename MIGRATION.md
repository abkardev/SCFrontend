# CRA → Vite Migration Guide

## What changed

| Item | CRA (before) | Vite (now) |
|------|--------------|------------|
| Entry point | `src/index.js` | `src/main.jsx` |
| HTML template | `public/index.html` | `index.html` (root) |
| Dev script | `npm start` / `react-scripts start` | `npm run dev` or `npm start` |
| Build script | `npm run build` / `react-scripts build` | `npm run build` / `vite build` |
| Preview build | — | `npm run preview` |
| Env prefix | `REACT_APP_*` | `VITE_*` |
| Env access | `process.env.REACT_APP_X` | `import.meta.env.VITE_X` |
| Config file | none (inside react-scripts) | `vite.config.js` |
| API proxy | `"proxy"` in package.json | `server.proxy` in vite.config.js |

## Install & run

```bash
cd frontend
npm install       # installs vite + @vitejs/plugin-react instead of react-scripts
npm run dev       # starts dev server on http://localhost:3000
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## Why Vite is faster

- **Cold start**: CRA bundles everything with Webpack before serving. Vite serves ES modules directly — 10-100× faster startup.
- **HMR**: Vite hot-reloads only the changed module. CRA re-bundles larger chunks.
- **Build**: Vite uses Rollup which produces smaller, better-split bundles.
- **No more deprecation warnings**: All the `inflight`, `@babel/plugin-proposal-*`, `@humanwhocodes/*` warnings came from `react-scripts` internals. Vite has none of them.

## Production environment variable

For production deployment, set `VITE_API_URL` in your hosting platform:

```
VITE_API_URL=https://your-backend.railway.app/api
```

In development this is not needed — vite.config.js proxies `/api` to `http://localhost:5000`.
