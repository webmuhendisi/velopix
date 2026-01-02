# Admin Login Sorun Giderme Rehberi

## 🔍 Tespit Edilen Sorunlar

### 1. API 500 Hatası
Login API'si 500 hatası veriyor. Bu genellikle:
- Veritabanı bağlantı sorunu
- Storage metodunda hata
- bcrypt karşılaştırma hatası

### 2. Test Sonuçları
- ✅ Admin kullanıcısı veritabanında mevcut
- ✅ Password hash doğru format
- ✅ bcrypt.compare çalışıyor
- ❌ API endpoint 500 hatası veriyor

## 🔧 Çözüm Adımları

### Adım 1: Server'ın Çalıştığından Emin Olun
```bash
npm run dev
```
Server'ın `http://localhost:3005` adresinde çalıştığından emin olun.

### Adım 2: Veritabanı Bağlantısını Kontrol Edin
```bash
npm run test-admin
```
Bu komut veritabanı bağlantısını ve admin kullanıcısını kontrol eder.

### Adım 3: Login API'sini Test Edin
```bash
npm run test-login-api
```
Bu komut login API'sini test eder ve hataları gösterir.

### Adım 4: Browser Console'u Kontrol Edin
1. `http://localhost:3005/admin/login` sayfasını açın
2. F12 ile Developer Tools'u açın
3. Console sekmesine bakın
4. Network sekmesinde `/api/admin/login` request'ini kontrol edin

### Adım 5: Server Loglarını Kontrol Edin
Server terminalinde şu logları arayın:
- `[LOGIN] Attempting login for user: ...`
- `[LOGIN] User found: ...`
- `[LOGIN] Error: ...`

## 🐛 Olası Sorunlar ve Çözümleri

### Sorun 1: "Login failed" Hatası
**Neden:** Server'da bir exception oluşuyor
**Çözüm:** 
- Server loglarını kontrol edin
- Veritabanı bağlantısını kontrol edin
- `.env` dosyasında `DATABASE_URL` doğru mu?

### Sorun 2: "Invalid credentials" Hatası
**Neden:** Kullanıcı adı veya şifre yanlış
**Çözüm:**
- Kullanıcı adı: `admin`
- Şifre: `admin123` (veya oluştururken verdiğiniz şifre)
- Yeni admin oluşturun: `npm run create-admin admin yenisifre`

### Sorun 3: "Bağlantı hatası" (Frontend)
**Neden:** API'ye ulaşılamıyor
**Çözüm:**
- Server çalışıyor mu?
- Port doğru mu? (3005)
- CORS sorunu var mı?

### Sorun 4: Veritabanı Bağlantı Hatası
**Neden:** MySQL bağlantısı başarısız
**Çözüm:**
```bash
# .env dosyasını kontrol edin
DATABASE_URL=mysql://root:password@localhost:3306/velopix

# MySQL'in çalıştığından emin olun
mysql -u root -p

# Veritabanını oluşturun
CREATE DATABASE velopix;

# Migration çalıştırın
npm run db:push
```

## 📝 Test Komutları

```bash
# Admin kullanıcısını test et
npm run test-admin

# Login API'sini test et
npm run test-login-api

# Login debug
npm run debug-login

# Yeni admin oluştur
npm run create-admin
```

## ✅ Başarılı Login İçin Gerekenler

1. ✅ MySQL çalışıyor
2. ✅ Veritabanı oluşturulmuş
3. ✅ Tablolar oluşturulmuş (npm run db:push)
4. ✅ Admin kullanıcısı oluşturulmuş
5. ✅ Server çalışıyor (npm run dev)
6. ✅ Port doğru (3005 veya .env'deki PORT)

## 🎯 Hızlı Test

Tarayıcıda şu URL'yi açın:
```
http://localhost:3005/admin/login
```

Kullanıcı adı: `admin`
Şifre: `admin123`

Eğer hala çalışmıyorsa, browser console'da hata mesajını kontrol edin.

