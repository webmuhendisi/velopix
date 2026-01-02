# 🔧 Login Sorunu Hızlı Çözüm

## ⚠️ Mevcut Durum
- Server çalışıyor ✅
- Veritabanı bağlantısı çalışıyor ✅
- Admin kullanıcısı mevcut ✅
- Login API 500 hatası veriyor ❌

## 🔍 Sorun Tespiti

Server terminalinde şu logları arayın:
```
[LOGIN] Attempting login for user: admin
[STORAGE] Searching for user: admin
[STORAGE] getUserByUsername error: ...
```

## 🛠️ Hızlı Çözüm

### 1. Server Terminalini Kontrol Edin
`npm run dev` çalıştırdığınız terminalde login denemesi yapın ve hata mesajını paylaşın.

### 2. Veritabanı Sorgusunu Test Edin
```bash
mysql -u root -e "USE velopix; SELECT * FROM users WHERE username='admin';"
```

### 3. Alternatif: Raw SQL Kullanımı
Eğer Drizzle ORM sorunu devam ederse, raw SQL kullanabiliriz.

## 📝 Test Komutları

```bash
# Veritabanı bağlantısını test et
npm run test-admin

# Login API'sini test et  
npm run test-login-api

# Debug login
npm run debug-login
```

## 🎯 Sonraki Adım

**Server terminalindeki hata mesajını paylaşın** - Bu sayede sorunu tam olarak tespit edebiliriz.

Server terminalinde şu satırları arayın:
- `[LOGIN] Error:`
- `[STORAGE] getUserByUsername error:`
- `Error stack:`

Bu loglar sorunun kaynağını gösterecektir.

