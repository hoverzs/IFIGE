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

A sorozat teljes egészében feltölthető előre. A kezdő dátumtól számítva minden nap automatikusan megnyílik a következő rész — nincs szükség manuális publikálásra.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Express API (JSON fájl + fájlfeltöltés)

## Élesítés (Railway)

Teljes app egy Railway szolgáltatáson: build + Express + API + feltöltések.

Részletes lépések: **[RAILWAY.md](./RAILWAY.md)**
