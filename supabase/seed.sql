-- ALYA APART TAKİP SİSTEMİ - Örnek veriler
-- Önce migration dosyasını çalıştırın, ardından bu dosyayı uygulayın.

INSERT INTO accommodation_units (name, status) VALUES
  ('Yaren 2', 'Dolu'),
  ('Belkız 3', 'Boş'),
  ('Ayşegül 7', 'Çıkış Bekliyor'),
  ('Berrin 8', 'Temizlik Bekliyor'),
  ('201', 'Dolu'),
  ('202', 'Boş'),
  ('203', 'Boş'),
  ('204', 'Dolu'),
  ('205', 'Çıkış Bekliyor'),
  ('301', 'Boş'),
  ('302', 'Dolu'),
  ('303', 'Temizlik Bekliyor'),
  ('304', 'Boş'),
  ('305', 'Dolu')
ON CONFLICT (name) DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Ahmet Yılmaz',
  '0532 111 2233',
  2,
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '3 days',
  id,
  15000.00,
  10000.00,
  'Erken giriş talep etti.',
  'Aktif'
FROM accommodation_units WHERE name = 'Yaren 2'
ON CONFLICT DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Fatma Demir',
  '0544 555 6677',
  3,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE,
  id,
  12000.00,
  12000.00,
  'Çıkış saati 11:00',
  'Aktif'
FROM accommodation_units WHERE name = 'Ayşegül 7'
ON CONFLICT DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Mehmet Kaya',
  '0555 888 9900',
  1,
  CURRENT_DATE - INTERVAL '1 days',
  CURRENT_DATE + INTERVAL '2 days',
  id,
  8000.00,
  4000.00,
  NULL,
  'Aktif'
FROM accommodation_units WHERE name = '201'
ON CONFLICT DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Zeynep Arslan',
  '0533 222 3344',
  4,
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE - INTERVAL '1 days',
  id,
  18000.00,
  18000.00,
  'Geçmiş rezervasyon örneği',
  'Geçmiş'
FROM accommodation_units WHERE name = '204'
ON CONFLICT DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Can Öztürk',
  '0542 777 8899',
  2,
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE,
  id,
  9500.00,
  9500.00,
  'Bugün çıkış yapacak',
  'Aktif'
FROM accommodation_units WHERE name = '205'
ON CONFLICT DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Elif Şahin',
  '0536 444 5566',
  2,
  CURRENT_DATE - INTERVAL '4 days',
  CURRENT_DATE + INTERVAL '1 days',
  id,
  11000.00,
  6000.00,
  'Ek yatak istedi',
  'Aktif'
FROM accommodation_units WHERE name = '302'
ON CONFLICT DO NOTHING;

INSERT INTO reservations (
  ad_soyad,
  telefon,
  kisi_sayisi,
  giris_tarihi,
  cikis_tarihi,
  konaklama_birimi_id,
  toplam_ucret,
  alinan_ucret,
  notlar,
  durum
)
SELECT
  'Burak Aydın',
  '0538 999 0011',
  1,
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '2 days',
  id,
  7000.00,
  3500.00,
  NULL,
  'Aktif'
FROM accommodation_units WHERE name = '305'
ON CONFLICT DO NOTHING;
