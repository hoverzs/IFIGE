# IFIge

Heti, 7 részes lelki minisorozatok fiataloknak — streaming-platform logikájú mobil webalkalmazás.

## Funkciók

- **Főoldal** — aktuális sorozat moziszerű borítóképpel, mai rész gomb
- **Epizódlista** — 7 kártya (elérhető / aktuális / zárolt)
- **Epizód tartalom** — igehely, gondolat, kérdés, ima, kép
- **Archívum** — korábbi sorozatok Netflix-szerű listában
- **Admin** — sorozat létrehozás, 7 napos storyboard szerkesztés, automatikus napi publikálás

## Indítás

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Ütemezés

A sorozat teljes egészében feltölthető előre. A **`startDate` mindig a hét hétfői dátuma** (`YYYY-MM-DD`). Onnantól naponta nyílik meg a következő rész — nincs szükség manuális publikálásra.

| day | Nap |
|-----|-----|
| 1 | Hétfő |
| 2 | Kedd |
| … | … |
| 7 | Vasárnap |

**Heti finálé (recap):** `startDate + 6 nap`, vasárnap **16:00** — **Europe/Bucharest** (= romániai helyi idő).

### Példa (helyes)

- `startDate: 2026-06-22` (hétfő)
- 1. rész: 2026-06-22, 7. rész: 2026-06-28 (vasárnap)
- Finálé: **2026-06-28 16:00** (Europe/Bucharest)

> ⚠️ A `2026-06-16` **kedd**, nem hétfő — rossz startDate lenne.

Automatikus teszt: `npm run test:publish`

### Több sorozat előre feltöltése

1. Adminban hozz létre sorozatokat **Vázlat** státusszal, töltsd fel a tartalmat.
2. Minden sorozathoz állíts be **hétfői startDate**-et (pl. `2026-06-22`, `2026-06-29`, …).
3. Ha kész, állítsd **Ütemezve** státuszra — egyszerre több is lehet ütemezve.
4. Az app a mai dátum alapján választja ki az aktuális hetet; a jövőbeli sorozat előnézetben látszik (zárolt epizódokkal).
5. A lezárult hetek az archívumban maradnak visszanézhetők.

Fejlesztői idő-szimuláció (csak lokálisan, **ne Railway-en**): `PUBLISH_TEST_NOW` — lásd `.env.example`

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Express API (JSON fájl + fájlfeltöltés)

## Élesítés (Railway)

Teljes app egy Railway szolgáltatáson: build + Express + API + feltöltések.

Részletes lépések: **[RAILWAY.md](./RAILWAY.md)**
