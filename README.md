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
2. `npm run frontend:install`
3. `frontend/.env` ichida `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` bo'lishi kerak
4. Root `.env` ichida `DATABASE_URL` bo'lishi kerak
5. Schema apply: `npm run db:apply`
6. Frontend run: `npm run frontend:dev`

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
- Vercel uchun root papkadan deploy qilinadi
- `vercel.json` root build script va SPA rewrite sozlamalarini o'z ichiga oladi
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - yoki `SUPABASE_URL`
  - yoki `SUPABASE_ANON_KEY`

## Vercel

1. Vercel'da repository'ni ulang
2. Root Directory sifatida repo ildizini qoldiring
3. Quyidagi env variable'larni qo'shing:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - yoki `SUPABASE_URL`
   - yoki `SUPABASE_ANON_KEY`
4. Build command avtomatik `npm run vercel-build` bo'ladi
5. Deploy qiling

Ichki route'lar uchun `404` chiqmasligi uchun rewrite allaqachon yoqilgan.
