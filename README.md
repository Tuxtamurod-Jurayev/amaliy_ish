# Amaliy_Ish

Supabase asosidagi universitet amaliy topshiriqlar tizimi.

## Stack

- React
- TypeScript
- TailwindCSS
- Supabase
- Vercel

## Lokal ishga tushirish

1. Root papkada `npm install`
2. `frontend` papkada `npm install`
3. `frontend/.env` ichida `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` bo'lishi kerak
4. Root `.env` ichida `DATABASE_URL` bo'lishi kerak
5. Schema apply: `npm run db:apply`
6. Frontend run: `cd frontend` va `npm run dev`

## Admin login

- `admin`
- `admin123`

## Muhim fayllar

- [database/schema.sql](c:\Users\Zevs\Desktop\lesssons\oraliq nazorat\database\schema.sql)
- [database/seed.sql](c:\Users\Zevs\Desktop\lesssons\oraliq nazorat\database\seed.sql)
- [database/apply.mjs](c:\Users\Zevs\Desktop\lesssons\oraliq nazorat\database\apply.mjs)
- [frontend/src/services/appService.ts](c:\Users\Zevs\Desktop\lesssons\oraliq nazorat\frontend\src\services\appService.ts)

## Deploy

- GitHub repository tayyorlanadi
- Frontend Vercel uchun tayyor
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
