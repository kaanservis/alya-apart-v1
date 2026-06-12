# ALYA APART TAKİP SİSTEMİ

Konaklama birimleri ve rezervasyon takibi için React + Supabase uygulaması.

## Teknolojiler

- React
- TypeScript
- Vite
- TailwindCSS
- Supabase

## Kurulum

```bash
npm install
```

`.env.example` dosyasını `.env` olarak kopyalayın ve Supabase bilgilerinizi girin:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Veritabanı

Supabase SQL editöründe sırasıyla şu dosyaları çalıştırın:

1. `supabase/migrations/001_initial_schema.sql` — tablolar, indeksler ve RLS politikaları
2. `supabase/seed.sql` — örnek konaklama birimleri ve rezervasyonlar

## Geliştirme

```bash
npm run dev
```

## Derleme

```bash
npm run build
```

## Faz 1 Kapsamı

- Konaklama birimleri tablosu (`accommodation_units`)
- Rezervasyonlar tablosu (`reservations`)
- Örnek veriler
- Tüm birimleri gösteren kontrol paneli (Dashboard)
