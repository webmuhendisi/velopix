# Categories Tablosu Database Yapısı

## 📊 Tablo Yapısı

Categories tablosu **tek bir tablo** ile hiyerarşik kategori yapısını sağlar. Bu yapıya **"Self-Referencing"** veya **"Adjacency List Model"** denir.

### Sütunlar

| Sütun Adı | Tip | Null | Açıklama |
|-----------|-----|------|----------|
| `id` | VARCHAR(36) | NO | Primary Key, UUID |
| `name` | VARCHAR(255) | NO | Kategori adı |
| `slug` | VARCHAR(255) | NO | URL-friendly kategori adı (unique) |
| **`parent_id`** | **VARCHAR(36)** | **YES** | **Alt kategoriler için parent kategori ID'si** |
| `icon` | VARCHAR(100) | YES | Kategori ikonu |
| **`order`** | **INT** | **YES** | **Sıralama (düşük sayı önce)** |
| `created_at` | TIMESTAMP | NO | Oluşturulma tarihi |
| `updated_at` | TIMESTAMP | NO | Güncellenme tarihi |

## 🔑 Önemli Sütunlar

### `parent_id` Sütunu
- **NULL ise** → Bu bir **ana kategori**dir
- **Değer varsa** → Bu bir **alt kategori**dir (değer, parent kategorinin `id`'si)

### `order` Sütunu
- Kategorilerin listelenme sırasını belirler
- Düşük sayı önce gösterilir

## 💡 Hiyerarşik Yapı Nasıl Çalışır?

### Örnek Veri Yapısı:

```
categories tablosu:
┌─────────────┬──────────────┬──────────────┬─────────────┬───────┐
│ id          │ name         │ slug         │ parent_id    │ order │
├─────────────┼──────────────┼──────────────┼─────────────┼───────┤
│ uuid-1      │ Ürünler      │ urunler      │ NULL         │ 1     │ ← Ana kategori
│ uuid-2      │ Bilgisayar   │ bilgisayar   │ NULL         │ 2     │ ← Ana kategori
│ uuid-3      │ Notebook     │ notebook     │ uuid-2       │ 1     │ ← Alt kategori (Bilgisayar'ın altı)
│ uuid-4      │ Gaming PC    │ gaming-pc    │ uuid-2       │ 2     │ ← Alt kategori (Bilgisayar'ın altı)
│ uuid-5      │ TV           │ tv           │ uuid-1       │ 1     │ ← Alt kategori (Ürünler'in altı)
└─────────────┴──────────────┴──────────────┴─────────────┴───────┘
```

### Hiyerarşik Yapı:

```
Ürünler (parent_id: NULL)
  └── TV (parent_id: uuid-1)

Bilgisayar (parent_id: NULL)
  ├── Notebook (parent_id: uuid-2)
  └── Gaming PC (parent_id: uuid-2)
```

## ✅ Avantajlar

1. **Tek Tablo**: Ayrı bir `subcategories` tablosu gerekmez
2. **Esnek**: İstediğiniz kadar seviye derinlik olabilir
3. **Basit**: Sadece `parent_id` ile ilişki kurulur
4. **Performanslı**: İyi indexlenmişse hızlı sorgular

## 🔍 SQL Sorguları

### Ana kategorileri getir:
```sql
SELECT * FROM categories WHERE parent_id IS NULL ORDER BY `order`, name;
```

### Belirli bir kategorinin alt kategorilerini getir:
```sql
SELECT * FROM categories WHERE parent_id = 'uuid-2' ORDER BY `order`, name;
```

### Tüm hiyerarşiyi getir (recursive):
```sql
-- Bu sorgu tüm seviyeleri getirir
SELECT 
  c1.id,
  c1.name,
  c1.parent_id,
  c2.name as parent_name
FROM categories c1
LEFT JOIN categories c2 ON c1.parent_id = c2.id
ORDER BY c1.`order`, c1.name;
```

## 📝 Schema Tanımı (TypeScript)

```typescript
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  parentId: varchar("parent_id", { length: 36 }),  // ← Alt kategoriler için
  icon: varchar("icon", { length: 100 }),
  order: int("order").default(0),                   // ← Sıralama için
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
```

## 🎯 Sonuç

**Alt kategoriler için ayrı bir tablo YOK!** 

Tüm kategoriler (ana ve alt) **tek bir `categories` tablosunda** tutulur. 
- `parent_id = NULL` → Ana kategori
- `parent_id = <id>` → Alt kategori

Bu yapı standart bir database tasarım desenidir ve çoğu modern uygulamada kullanılır.

