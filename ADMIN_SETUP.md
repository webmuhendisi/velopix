# Admin Panel Kurulum Rehberi

## 1. İlk Admin Kullanıcısı Oluşturma

Veritabanı migration'larını çalıştırdıktan sonra ilk admin kullanıcısını oluşturun:

```bash
npm run create-admin
```

Veya özel kullanıcı adı ve şifre ile:

```bash
npm run create-admin kullaniciadi sifre123
```

Varsayılan:
- Kullanıcı Adı: `admin`
- Şifre: `admin123`

## 2. Admin Panele Giriş

1. Tarayıcınızda şu adrese gidin:
   ```
   http://localhost:5000/admin/login
   ```

2. Oluşturduğunuz admin kullanıcı adı ve şifre ile giriş yapın.

## 3. Admin Panel Özellikleri

### ✅ Mevcut Özellikler:
- **Dashboard**: Genel istatistikler
- **Ürün Yönetimi**: Ürün ekleme, düzenleme, silme
- **Kategori Yönetimi**: Kategori ekleme, düzenleme, silme
- **Sipariş Yönetimi**: Siparişleri görüntüleme ve durum güncelleme

### 🔄 Yakında Eklenecek:
- Internet Paketleri Yönetimi
- Tamir Servisleri Yönetimi
- İletişim Bilgileri Yönetimi

## 4. API Endpoints

### Public Endpoints:
- `GET /api/products` - Tüm ürünler
- `GET /api/products/:id` - Tek ürün
- `GET /api/categories` - Tüm kategoriler
- `GET /api/internet-packages` - Internet paketleri
- `GET /api/repair-services` - Tamir servisleri
- `GET /api/settings` - Ayarlar

### Admin Endpoints (Authentication gerekli):
- `GET /api/admin/*` - Tüm admin endpoint'leri
- `POST /api/admin/*` - Oluşturma
- `PUT /api/admin/*` - Güncelleme
- `DELETE /api/admin/*` - Silme

## 5. Notlar

- Admin token localStorage'da saklanır
- Token süresi yok (manuel çıkış gerekli)
- Tüm admin işlemleri authentication gerektirir
