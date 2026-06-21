# IFIge — Railway deploy útmutató

Teljes alkalmazás (React + Express API + feltöltések) egyetlen Railway szolgáltatáson.

---

## Előfeltételek

- GitHub repo: `https://github.com/hoverzs/IFIGE`
- [Railway](https://railway.com) fiók
- A kód legyen pusholva a GitHubra

---

## 1. Railway projekt létrehozása

1. Lépj be a [Railway Dashboard](https://railway.com/dashboard)-ra.
2. **New Project** → **Deploy from GitHub repo**.
3. Válaszd ki a **hoverzs/IFIGE** repót.
4. Railway automatikusan felismeri a Node.js projektet.

---

## 2. Build és start (automatikus)

A repo tartalmaz `railway.toml` fájlt:

| Lépés | Parancs |
|-------|---------|
| Build | `npm run build` (Vite → `dist/`) |
| Start | `npm start` (Express, production mód) |

Railway beállítja: `NODE_ENV=production` és a `PORT` változót.

---

## 3. Publikus URL

1. A szolgáltatásnál: **Settings** → **Networking**.
2. **Generate Domain** — kapsz egy URL-t (pl. `ifige-production.up.railway.app`).
3. Nyisd meg böngészőben — a React app és az API ugyanonnan fut.

Health check: `https://<domain>/api/health` → `{"ok":true}`

---

## 4. Perzisztens adatok (Volume) — fontos!

Alapértelmezetten a `data/` (sorozat JSON) és `uploads/` (képek, videók) **újraindításkor / redeploy-nál elveszhetnek**, mert a konténer fájlrendszere ideiglenes.

### Volume beállítása

1. Railway projekt → **Add Volume**.
2. Csatold a web szolgáltatáshoz.
3. **Mount path:** `/data`

4. **Variables** (Environment) — add hozzá:

```
DATA_DIR=/data/data
UPLOADS_DIR=/data/uploads
```

5. Redeploy.

**Első deploy után üres tartalom?** A repo `seed/` mappája automatikusan betölti a „Több van benned!” sorozatot. Ha már létrejött üres seed a Volume-on, egyszer állítsd be:

```
FORCE_SEED=true
```

Redeploy után vedd ki ezt a változót.

Ezután a sorozatok, képek és videók megmaradnak újraindítás után is.

---

## 5. Környezeti változók (opcionális)

| Változó | Alapértelmezés | Leírás |
|---------|----------------|--------|
| `NODE_ENV` | `production` (Railway) | Production mód, `dist/` kiszolgálása |
| `PORT` | Railway adja | HTTP port |
| `DATA_DIR` | `./data` | Sorozat JSON mappa |
| `UPLOADS_DIR` | `./uploads` | Feltöltött fájlok |
| `HOST` | `0.0.0.0` | Bind cím |
| `PUBLISH_TEST_NOW` | — | **Csak lokális fejlesztés.** Szimulált időpont. **Ne állítsd be Railway-en** — production módban figyelmen kívül marad, de feleslegesen ott ne legyen. |

Példa fájl: `.env.example`

### Publikálási időzóna

- **Europe/Bucharest** = romániai helyi idő
- Heti finálé: vasárnap 16:00 ebben az időzónában
- `startDate` mindig **hétfő** legyen

Példa: `startDate: 2026-06-22` (hétfő) → finálé: `2026-06-28 16:00` (vasárnap)

Dátumtesztek: `npm run test:publish`

---

## 6. Lokális production teszt

```bash
npm install
npm run build
# Windows PowerShell:
$env:NODE_ENV="production"; npm start

# Linux / macOS:
NODE_ENV=production npm start
```

- App: http://localhost:3001
- API: http://localhost:3001/api/health

Fejlesztés továbbra is: `npm run dev` (Vite :5173 + API :3001).

---

## 7. Deploy folyamat (Git push után)

1. Push a `main` branchre → Railway automatikusan buildel és deployol.
2. **Deployments** fülön kövesd a logot.
3. Sikeres build után az URL él.

---

## 8. Hibakeresés

| Probléma | Megoldás |
|----------|----------|
| Üres oldal | Build log: lefutott-e `npm run build`? |
| API 404 | Health check: `/api/health` |
| Képek eltűnnek redeploy után | Volume + `DATA_DIR` / `UPLOADS_DIR` |
| Feltöltés nem működik | Volume mount és írási jog ellenőrzése |

Railway log: szolgáltatás → **View Logs** — induláskor látszik:
```
IFIge production: http://0.0.0.0:XXXX
  data:    /data/data
  uploads: /data/uploads
```

---

## Architektúra

```
Railway (egy szolgáltatás)
├── Express :PORT
│   ├── /api/*        → JSON API
│   ├── /uploads/*    → feltöltött média
│   └── /*            → React SPA (dist/)
├── data/             → series.json, config.json (Volume ajánlott)
└── uploads/          → képek, videók (Volume ajánlott)
```

Nincs külön frontend/backend deploy — minden egy processben fut.
