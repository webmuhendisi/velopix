import "dotenv/config";
import { db } from "../server/db";
import { storage } from "../server/storage";
import {
  products,
  productImages,
  productReviews,
  orders,
  orderItems,
  internetPackages,
  repairServices,
  repairRequests,
  repairRequestImages,
  slides,
  blogPosts,
  settings,
  shippingRegions,
  newsletterSubscriptions,
  campaigns,
  campaignProducts,
  contactMessages,
  faqs,
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function truncateTables() {
  console.log("🗑️  Admin dışındaki tüm tablolar temizleniyor...\n");
  
  // Foreign key constraint'leri geçici olarak devre dışı bırak
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  
  try {
    // Sırayla truncate et (foreign key sırasına göre)
    const tables = [
      "campaign_products",
      "campaigns",
      "product_reviews",
      "product_images",
      "order_items",
      "orders",
      "repair_request_images",
      "repair_requests",
      "newsletter_subscriptions",
      "contact_messages",
      "faqs",
      "blog_posts",
      "slides",
      "shipping_regions",
      "settings",
      "internet_packages",
      "repair_services",
      "products",
    ];
    
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${table}`));
        console.log(`✅ ${table} temizlendi`);
      } catch (error: any) {
        console.log(`⚠️  ${table} temizlenirken hata: ${error.message}`);
      }
    }
  } finally {
    // Foreign key constraint'leri tekrar aktif et
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  }
  
  console.log("\n✅ Tüm tablolar temizlendi!\n");
}

async function seedDemoData() {
  try {
    // Önce tabloları temizle
    await truncateTables();
    
    // Kategorileri al (kategori seeder'ı çalıştırılmış olmalı)
    const allCategories = await storage.getCategories();
    console.log(`📂 Toplam ${allCategories.length} kategori bulundu`);
    
    if (allCategories.length === 0) {
      console.log("⚠️  Uyarı: Henüz kategori yok. Önce kategori seeder'ını çalıştırın!");
      console.log("💡 Çalıştırın: npm run seed-categories");
      return;
    }
    
    // Kategori slug'larını logla
    console.log("📋 Kategoriler:", allCategories.map(c => c.slug).join(", "));
    
    const notebookCategory = allCategories.find(c => c.slug === "notebook") || allCategories[0];
    const phoneCategory = allCategories.find(c => c.slug === "cep-telefonlari") || allCategories[0];
    const monitorCategory = allCategories.find(c => c.slug === "monitorler-parcalar") || allCategories[0];
    const gamingCategory = allCategories.find(c => c.slug === "gaming-notebook-ana") || allCategories[0];
    const tabletCategory = allCategories.find(c => c.slug === "tablet") || allCategories[0];
    const keyboardCategory = allCategories.find(c => c.slug === "klavye-parcalar") || allCategories[0];
    const headphoneCategory = allCategories.find(c => c.slug === "kulakliklar-ve-hoparlorler") || allCategories[0];
    const mouseCategory = allCategories.find(c => c.slug === "mouse-parcalar") || allCategories[0];
    const tvCategory = allCategories.find(c => c.slug === "televizyon") || allCategories[0];
    const desktopCategory = allCategories.find(c => c.slug === "masaustu-pc") || allCategories[0];
    
    console.log(`✅ Kategoriler hazır:`);
    console.log(`   - Notebook: ${notebookCategory.name} (${notebookCategory.id})`);
    console.log(`   - Phone: ${phoneCategory.name} (${phoneCategory.id})`);
    console.log(`   - Monitor: ${monitorCategory.name} (${monitorCategory.id})`);
    console.log(`   - Gaming: ${gamingCategory.name} (${gamingCategory.id})`);
    
    console.log("🌱 Demo veriler ekleniyor...\n");
    
    // 1. Repair Services
    console.log("📦 Repair Services ekleniyor...");
    const repairService1 = await storage.createRepairService({
      name: "Bilgisayar Tamiri",
      description: "Notebook, masaüstü bilgisayar ve tablet tamiri",
      icon: "Laptop",
    });
    const repairService2 = await storage.createRepairService({
      name: "Telefon Tamiri",
      description: "Cep telefonu ekran değişimi ve tamiri",
      icon: "Smartphone",
    });
    const repairService3 = await storage.createRepairService({
      name: "Yazılım Kurulumu",
      description: "İşletim sistemi ve program kurulumu",
      icon: "Settings",
    });
    console.log(`✅ ${3} repair service eklendi\n`);
    
    // 2. Internet Packages
    console.log("📦 Internet Packages ekleniyor...");
    const internetPackage1 = await storage.createInternetPackage({
      name: "Fiber 100 Mbps",
      speed: 100,
      price: "299.00",
      provider: "TurkNet",
      features: JSON.stringify(["Sınırsız kullanım", "7/24 destek", "Ücretsiz kurulum"]),
      highlighted: true,
    });
    const internetPackage2 = await storage.createInternetPackage({
      name: "Fiber 250 Mbps",
      speed: 250,
      price: "399.00",
      provider: "TurkNet",
      features: JSON.stringify(["Sınırsız kullanım", "7/24 destek", "Ücretsiz kurulum", "IPTV dahil"]),
      highlighted: true,
    });
    const internetPackage3 = await storage.createInternetPackage({
      name: "Fiber 500 Mbps",
      speed: 500,
      price: "599.00",
      provider: "Superonline",
      features: JSON.stringify(["Sınırsız kullanım", "7/24 destek", "Ücretsiz kurulum", "IPTV dahil", "Oyun modu"]),
      highlighted: false,
    });
    console.log(`✅ ${3} internet package eklendi\n`);
    
    // 3. Products
    console.log("📦 Products ekleniyor...");
    let product1, product2, product3, product4, product5, product6, product7, product8, product9, product10;
    let product11, product12, product13, product14, product15, product16, product17, product18, product19, product20;
    
    try {
      product1 = await storage.createProduct({
      title: "ASUS ROG Strix G15 Gaming Notebook",
      description: "AMD Ryzen 9 5900HX, 16GB RAM, 1TB SSD, RTX 3060 6GB, 15.6\" FHD 144Hz",
      price: "24999.00",
      originalPrice: "27999.00",
      image: "/uploads/gaming-notebook.jpg",
      categoryId: gamingCategory.id,
      isNew: true,
      limitedStock: 5,
      inStock: true,
      brand: "ASUS",
      sku: "ASUS-ROG-G15-001",
      metaTitle: "ASUS ROG Strix G15 Gaming Notebook - En İyi Fiyat",
      metaDescription: "Güçlü performans ve yüksek kalite ile ASUS ROG Strix G15 gaming notebook. RTX 3060 ekran kartı ve AMD Ryzen 9 işlemci.",
      specifications: JSON.stringify({
        "İşlemci": "AMD Ryzen 9 5900HX",
        "RAM": "16GB DDR4",
        "Depolama": "1TB SSD",
        "Ekran Kartı": "NVIDIA RTX 3060 6GB",
        "Ekran": "15.6\" FHD 144Hz",
        "İşletim Sistemi": "Windows 11",
      }),
    });
    
      product2 = await storage.createProduct({
      title: "iPhone 15 Pro Max 256GB",
      description: "Titanium, A17 Pro çip, 48MP kamera, 256GB depolama",
      price: "54999.00",
      originalPrice: "59999.00",
      image: "/uploads/iphone-15-pro-max.jpg",
      categoryId: phoneCategory.id,
      isNew: true,
      limitedStock: 10,
      inStock: true,
      brand: "Apple",
      sku: "APPLE-IP15PM-256",
      metaTitle: "iPhone 15 Pro Max 256GB - Titanium - En İyi Fiyat",
      metaDescription: "Apple'ın en yeni flagship telefonu iPhone 15 Pro Max. Titanium gövde, A17 Pro çip ve 48MP kamera.",
      specifications: JSON.stringify({
        "Ekran": "6.7\" Super Retina XDR",
        "İşlemci": "A17 Pro",
        "RAM": "8GB",
        "Depolama": "256GB",
        "Kamera": "48MP Ana + 12MP Ultra Wide + 12MP Tele",
        "Batarya": "4441 mAh",
      }),
    });
    
      product3 = await storage.createProduct({
      title: "Samsung Odyssey G7 32\" QHD Gaming Monitör",
      description: "32\" QHD 240Hz, 1ms, Curved, HDR600, G-Sync Compatible",
      price: "8999.00",
      originalPrice: "10999.00",
      image: "/uploads/samsung-odyssey-g7.jpg",
      categoryId: monitorCategory.id,
      isNew: false,
      limitedStock: 8,
      inStock: true,
      brand: "Samsung",
      sku: "SAMSUNG-ODYSSEY-G7-32",
      metaTitle: "Samsung Odyssey G7 32\" QHD Gaming Monitör",
      metaDescription: "240Hz yenileme hızı ve 1ms yanıt süresi ile profesyonel gaming monitörü.",
      specifications: JSON.stringify({
        "Ekran Boyutu": "32\"",
        "Çözünürlük": "2560x1440 (QHD)",
        "Yenileme Hızı": "240Hz",
        "Yanıt Süresi": "1ms",
        "Panel Tipi": "VA Curved",
        "HDR": "HDR600",
      }),
    });
    
      product4 = await storage.createProduct({
      title: "MacBook Pro 14\" M3 Pro",
      description: "Apple M3 Pro çip, 18GB RAM, 512GB SSD, 14.2\" Liquid Retina XDR",
      price: "69999.00",
      originalPrice: null,
      image: "/uploads/macbook-pro-14-m3.jpg",
      categoryId: notebookCategory.id,
      isNew: true,
      limitedStock: 3,
      inStock: true,
      brand: "Apple",
      sku: "APPLE-MBP14-M3P",
      metaTitle: "MacBook Pro 14\" M3 Pro - En İyi Fiyat",
      metaDescription: "Apple M3 Pro çip ile güçlü performans. Profesyonel kullanıcılar için ideal.",
      specifications: JSON.stringify({
        "İşlemci": "Apple M3 Pro",
        "RAM": "18GB",
        "Depolama": "512GB SSD",
        "Ekran": "14.2\" Liquid Retina XDR",
        "Batarya": "70Wh",
        "Ağırlık": "1.6 kg",
      }),
    });
    
      product5 = await storage.createProduct({
      title: "Logitech MX Master 3S Kablosuz Mouse",
      description: "Ergonomik tasarım, 8000 DPI, USB-C şarj, 70 gün batarya",
      price: "1299.00",
      originalPrice: "1599.00",
      image: "/uploads/logitech-mx-master-3s.jpg",
      categoryId: mouseCategory.id,
      isNew: false,
      limitedStock: 20,
      inStock: true,
      brand: "Logitech",
      sku: "LOGITECH-MX3S-001",
      metaTitle: "Logitech MX Master 3S Kablosuz Mouse",
      metaDescription: "Profesyonel kullanıcılar için ergonomik ve özellik dolu kablosuz mouse.",
      specifications: JSON.stringify({
        "DPI": "8000",
        "Bağlantı": "Bluetooth / USB Receiver",
        "Batarya": "70 gün",
        "Şarj": "USB-C",
        "Ağırlık": "141g",
      }),
    });
    
      product6 = await storage.createProduct({
      title: "Samsung Galaxy S24 Ultra 512GB",
      description: "Snapdragon 8 Gen 3, 12GB RAM, 512GB, 200MP kamera, S Pen",
      price: "44999.00",
      originalPrice: "49999.00",
      image: "/uploads/samsung-galaxy-s24-ultra.jpg",
      categoryId: phoneCategory.id,
      isNew: true,
      limitedStock: 15,
      inStock: true,
      brand: "Samsung",
      sku: "SAMSUNG-S24U-512",
      metaTitle: "Samsung Galaxy S24 Ultra 512GB - En İyi Fiyat",
      metaDescription: "Samsung'un en güçlü flagship telefonu. 200MP kamera ve S Pen desteği.",
      specifications: JSON.stringify({
        "Ekran": "6.8\" Dynamic AMOLED 2X",
        "İşlemci": "Snapdragon 8 Gen 3",
        "RAM": "12GB",
        "Depolama": "512GB",
        "Kamera": "200MP Ana + 50MP Ultra Wide + 10MP Tele + 12MP Periscope",
        "Batarya": "5000 mAh",
      }),
    });
    
      product7 = await storage.createProduct({
      title: "iPad Pro 12.9\" M2 256GB",
      description: "Apple M2 çip, 12.9\" Liquid Retina XDR, 256GB, Wi-Fi",
      price: "32999.00",
      originalPrice: null,
      image: "/uploads/ipad-pro-12-9-m2.jpg",
      categoryId: tabletCategory.id,
      isNew: true,
      limitedStock: 8,
      inStock: true,
      brand: "Apple",
      sku: "APPLE-IPADP12-M2",
      metaTitle: "iPad Pro 12.9\" M2 256GB - En İyi Fiyat",
      metaDescription: "Apple M2 çip ile güçlü performans. Profesyonel kullanım için ideal tablet.",
      specifications: JSON.stringify({
        "Ekran": "12.9\" Liquid Retina XDR",
        "İşlemci": "Apple M2",
        "RAM": "8GB",
        "Depolama": "256GB",
        "Kamera": "12MP Wide + 10MP Ultra Wide",
        "Batarya": "40.88 Wh",
      }),
    });
    
      product8 = await storage.createProduct({
      title: "Corsair K70 RGB TKL Klavye",
      description: "Mekanik klavye, Cherry MX Red, RGB aydınlatma, TKL tasarım",
      price: "2499.00",
      originalPrice: "2999.00",
      image: "/uploads/corsair-k70-rgb-tkl.jpg",
      categoryId: keyboardCategory.id,
      isNew: false,
      limitedStock: 12,
      inStock: true,
      brand: "Corsair",
      sku: "CORSAIR-K70-TKL",
      metaTitle: "Corsair K70 RGB TKL Mekanik Klavye",
      metaDescription: "Cherry MX Red switch ile profesyonel gaming klavyesi.",
      specifications: JSON.stringify({
        "Switch": "Cherry MX Red",
        "Aydınlatma": "RGB",
        "Format": "TKL (Tenkeyless)",
        "Bağlantı": "USB-C",
        "Ağırlık": "850g",
      }),
    });
    
      product9 = await storage.createProduct({
      title: "Sony WH-1000XM5 Kablosuz Kulaklık",
      description: "Aktif gürültü önleme, 30 saat batarya, Hi-Res Audio",
      price: "8999.00",
      originalPrice: "10999.00",
      image: "/uploads/sony-wh-1000xm5.jpg",
      categoryId: headphoneCategory.id,
      isNew: true,
      limitedStock: 10,
      inStock: true,
      brand: "Sony",
      sku: "SONY-WH1000XM5",
      metaTitle: "Sony WH-1000XM5 Kablosuz Kulaklık",
      metaDescription: "Dünyanın en iyi aktif gürültü önleme teknolojisi.",
      specifications: JSON.stringify({
        "Tip": "Over-ear",
        "Gürültü Önleme": "Aktif (ANC)",
        "Batarya": "30 saat",
        "Bağlantı": "Bluetooth 5.2",
        "Ağırlık": "250g",
      }),
    });
    
      product10 = await storage.createProduct({
      title: "LG OLED C3 55\" 4K TV",
      description: "55\" OLED, 4K UHD, HDR10, Dolby Vision, webOS",
      price: "34999.00",
      originalPrice: "39999.00",
      image: "/uploads/lg-oled-c3-55.jpg",
      categoryId: tvCategory.id,
      isNew: true,
      limitedStock: 6,
      inStock: true,
      brand: "LG",
      sku: "LG-OLED-C3-55",
      metaTitle: "LG OLED C3 55\" 4K TV - En İyi Fiyat",
      metaDescription: "OLED teknolojisi ile mükemmel görüntü kalitesi.",
      specifications: JSON.stringify({
        "Ekran Boyutu": "55\"",
        "Çözünürlük": "4K UHD (3840x2160)",
        "Panel Tipi": "OLED",
        "HDR": "HDR10, Dolby Vision",
        "İşletim Sistemi": "webOS",
      }),
    });
    
      product11 = await storage.createProduct({
      title: "HP Pavilion Desktop TP01-2000",
      description: "Intel Core i5-12400, 16GB RAM, 512GB SSD, Windows 11",
      price: "14999.00",
      originalPrice: "17999.00",
      image: "/uploads/hp-pavilion-desktop.jpg",
      categoryId: desktopCategory.id,
      isNew: false,
      limitedStock: 7,
      inStock: true,
      brand: "HP",
      sku: "HP-PAV-TP01",
      metaTitle: "HP Pavilion Desktop TP01-2000",
      metaDescription: "Günlük kullanım için ideal masaüstü bilgisayar.",
      specifications: JSON.stringify({
        "İşlemci": "Intel Core i5-12400",
        "RAM": "16GB DDR4",
        "Depolama": "512GB SSD",
        "İşletim Sistemi": "Windows 11",
        "Grafik": "Intel UHD Graphics 730",
      }),
    });
    
      product12 = await storage.createProduct({
      title: "Xiaomi 13 Pro 256GB",
      description: "Snapdragon 8 Gen 2, 12GB RAM, 256GB, 50MP Leica kamera",
      price: "29999.00",
      originalPrice: "34999.00",
      image: "/uploads/xiaomi-13-pro.jpg",
      categoryId: phoneCategory.id,
      isNew: true,
      limitedStock: 12,
      inStock: true,
      brand: "Xiaomi",
      sku: "XIAOMI-13P-256",
      metaTitle: "Xiaomi 13 Pro 256GB - Leica Kamera",
      metaDescription: "Leica işbirliği ile geliştirilmiş profesyonel kamera sistemi.",
      specifications: JSON.stringify({
        "Ekran": "6.73\" LTPO AMOLED",
        "İşlemci": "Snapdragon 8 Gen 2",
        "RAM": "12GB",
        "Depolama": "256GB",
        "Kamera": "50MP Leica + 50MP Ultra Wide + 50MP Tele",
        "Batarya": "4820 mAh",
      }),
    });
    
      product13 = await storage.createProduct({
      title: "Dell XPS 15 9530",
      description: "Intel Core i7-13700H, 32GB RAM, 1TB SSD, RTX 4050, 15.6\" OLED",
      price: "54999.00",
      originalPrice: "59999.00",
      image: "/uploads/dell-xps-15-9530.jpg",
      categoryId: notebookCategory.id,
      isNew: true,
      limitedStock: 4,
      inStock: true,
      brand: "Dell",
      sku: "DELL-XPS15-9530",
      metaTitle: "Dell XPS 15 9530 - Premium Notebook",
      metaDescription: "Profesyonel içerik üreticileri için güçlü performans.",
      specifications: JSON.stringify({
        "İşlemci": "Intel Core i7-13700H",
        "RAM": "32GB DDR5",
        "Depolama": "1TB SSD",
        "Ekran Kartı": "NVIDIA RTX 4050 6GB",
        "Ekran": "15.6\" OLED 3.5K",
        "İşletim Sistemi": "Windows 11 Pro",
      }),
    });
    
      product14 = await storage.createProduct({
      title: "ASUS ROG Swift PG32UCDM 32\" 4K",
      description: "32\" 4K OLED, 240Hz, 0.03ms, G-Sync, HDR10",
      price: "19999.00",
      originalPrice: "22999.00",
      image: "/uploads/asus-rog-swift-pg32ucdm.jpg",
      categoryId: monitorCategory.id,
      isNew: true,
      limitedStock: 5,
      inStock: true,
      brand: "ASUS",
      sku: "ASUS-PG32UCDM",
      metaTitle: "ASUS ROG Swift PG32UCDM 32\" 4K OLED",
      metaDescription: "OLED teknolojisi ile 4K gaming monitörü.",
      specifications: JSON.stringify({
        "Ekran Boyutu": "32\"",
        "Çözünürlük": "4K UHD (3840x2160)",
        "Yenileme Hızı": "240Hz",
        "Yanıt Süresi": "0.03ms",
        "Panel Tipi": "OLED",
        "HDR": "HDR10",
      }),
    });
    
      product15 = await storage.createProduct({
      title: "Razer DeathAdder V3 Pro",
      description: "Kablosuz gaming mouse, 30K DPI, 90 saat batarya",
      price: "1999.00",
      originalPrice: "2499.00",
      image: "/uploads/razer-deathadder-v3-pro.jpg",
      categoryId: mouseCategory.id,
      isNew: true,
      limitedStock: 15,
      inStock: true,
      brand: "Razer",
      sku: "RAZER-DA-V3-PRO",
      metaTitle: "Razer DeathAdder V3 Pro Kablosuz Mouse",
      metaDescription: "Profesyonel oyuncular için tasarlanmış kablosuz gaming mouse.",
      specifications: JSON.stringify({
        "DPI": "30000",
        "Bağlantı": "2.4GHz Wireless / USB-C",
        "Batarya": "90 saat",
        "Ağırlık": "63g",
        "Switch": "Optical",
      }),
    });
    
      product16 = await storage.createProduct({
      title: "AirPods Pro 2 USB-C",
      description: "Aktif gürültü önleme, Spatial Audio, USB-C şarj",
      price: "8999.00",
      originalPrice: "9999.00",
      image: "/uploads/airpods-pro-2.jpg",
      categoryId: headphoneCategory.id,
      isNew: true,
      limitedStock: 20,
      inStock: true,
      brand: "Apple",
      sku: "APPLE-AIRPODS-PRO2",
      metaTitle: "AirPods Pro 2 USB-C - Aktif Gürültü Önleme",
      metaDescription: "Apple'ın en gelişmiş kablosuz kulaklığı.",
      specifications: JSON.stringify({
        "Tip": "In-ear",
        "Gürültü Önleme": "Aktif (ANC)",
        "Batarya": "6 saat (kulaklık) + 24 saat (kutu)",
        "Bağlantı": "Bluetooth 5.3",
        "Şarj": "USB-C",
      }),
    });
    
      product17 = await storage.createProduct({
      title: "SteelSeries Apex Pro TKL",
      description: "Mekanik klavye, OmniPoint switch, RGB, TKL",
      price: "2999.00",
      originalPrice: "3499.00",
      image: "/uploads/steelseries-apex-pro-tkl.jpg",
      categoryId: keyboardCategory.id,
      isNew: false,
      limitedStock: 10,
      inStock: true,
      brand: "SteelSeries",
      sku: "STEELSERIES-APEX-TKL",
      metaTitle: "SteelSeries Apex Pro TKL Mekanik Klavye",
      metaDescription: "Ayarlanabilir tuş hassasiyeti ile özel gaming klavyesi.",
      specifications: JSON.stringify({
        "Switch": "OmniPoint (Ayarlanabilir)",
        "Aydınlatma": "RGB",
        "Format": "TKL",
        "Bağlantı": "USB-C",
        "Ağırlık": "780g",
      }),
    });
    
      product18 = await storage.createProduct({
      title: "Lenovo Legion 5 Pro",
      description: "AMD Ryzen 7 7745HX, 32GB RAM, 1TB SSD, RTX 4070, 16\" WQXGA",
      price: "39999.00",
      originalPrice: "44999.00",
      image: "/uploads/lenovo-legion-5-pro.jpg",
      categoryId: gamingCategory.id,
      isNew: true,
      limitedStock: 6,
      inStock: true,
      brand: "Lenovo",
      sku: "LENOVO-LEG5PRO",
      metaTitle: "Lenovo Legion 5 Pro Gaming Notebook",
      metaDescription: "Yüksek performanslı gaming notebook, RTX 4070 ekran kartı.",
      specifications: JSON.stringify({
        "İşlemci": "AMD Ryzen 7 7745HX",
        "RAM": "32GB DDR5",
        "Depolama": "1TB SSD",
        "Ekran Kartı": "NVIDIA RTX 4070 8GB",
        "Ekran": "16\" WQXGA 165Hz",
        "İşletim Sistemi": "Windows 11",
      }),
    });
    
      product19 = await storage.createProduct({
      title: "OnePlus 12 256GB",
      description: "Snapdragon 8 Gen 3, 16GB RAM, 256GB, 50MP kamera, 100W şarj",
      price: "34999.00",
      originalPrice: "39999.00",
      image: "/uploads/oneplus-12.jpg",
      categoryId: phoneCategory.id,
      isNew: true,
      limitedStock: 8,
      inStock: true,
      brand: "OnePlus",
      sku: "ONEPLUS-12-256",
      metaTitle: "OnePlus 12 256GB - Hızlı Şarj",
      metaDescription: "100W hızlı şarj teknolojisi ile güçlü performans.",
      specifications: JSON.stringify({
        "Ekran": "6.82\" LTPO AMOLED",
        "İşlemci": "Snapdragon 8 Gen 3",
        "RAM": "16GB",
        "Depolama": "256GB",
        "Kamera": "50MP Ana + 48MP Ultra Wide + 64MP Periscope",
        "Şarj": "100W SuperVOOC",
      }),
    });
    
      product20 = await storage.createProduct({
      title: "Samsung Galaxy Tab S9 Ultra",
      description: "Snapdragon 8 Gen 2, 12GB RAM, 512GB, 14.6\" Super AMOLED, S Pen",
      price: "29999.00",
      originalPrice: "34999.00",
      image: "/uploads/samsung-galaxy-tab-s9-ultra.jpg",
      categoryId: tabletCategory.id,
      isNew: true,
      limitedStock: 5,
      inStock: true,
      brand: "Samsung",
      sku: "SAMSUNG-TABS9U",
      metaTitle: "Samsung Galaxy Tab S9 Ultra 14.6\"",
      metaDescription: "En büyük Android tablet, S Pen desteği ile.",
      specifications: JSON.stringify({
        "Ekran": "14.6\" Super AMOLED",
        "İşlemci": "Snapdragon 8 Gen 2",
        "RAM": "12GB",
        "Depolama": "512GB",
        "Kamera": "13MP + 8MP",
        "Batarya": "11200 mAh",
      }),
    });
    
      console.log(`✅ ${20} product eklendi\n`);
    } catch (error: any) {
      console.error("❌ Ürün eklenirken hata:", error);
      console.error("Hata detayı:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
    
    // 4. Product Images
    console.log("📦 Product Images ekleniyor...");
    await storage.createProductImage({
      productId: product1.id,
      imageUrl: "/uploads/gaming-notebook-1.jpg",
      alt: "ASUS ROG Strix G15 - Ön Görünüm",
      order: 0,
      isPrimary: true,
    });
    await storage.createProductImage({
      productId: product1.id,
      imageUrl: "/uploads/gaming-notebook-2.jpg",
      alt: "ASUS ROG Strix G15 - Klavye",
      order: 1,
      isPrimary: false,
    });
    await storage.createProductImage({
      productId: product2.id,
      imageUrl: "/uploads/iphone-15-pro-max-1.jpg",
      alt: "iPhone 15 Pro Max - Ön Görünüm",
      order: 0,
      isPrimary: true,
    });
    console.log(`✅ Product images eklendi\n`);
    
    // 5. Product Reviews
    console.log("📦 Product Reviews ekleniyor...");
    await storage.createProductReview({
      productId: product1.id,
      customerName: "Ahmet Yılmaz",
      customerPhone: "05551234567",
      rating: 5,
      comment: "Harika bir gaming notebook! Oyunlarda çok akıcı çalışıyor.",
      verifiedPurchase: true,
      approved: true,
    });
    await storage.createProductReview({
      productId: product1.id,
      customerName: "Mehmet Demir",
      customerPhone: "05559876543",
      rating: 4,
      comment: "Güzel ürün ama biraz ağır. Performansı mükemmel.",
      verifiedPurchase: true,
      approved: true,
    });
    await storage.createProductReview({
      productId: product2.id,
      customerName: "Ayşe Kaya",
      customerPhone: "05551112233",
      rating: 5,
      comment: "Kamera kalitesi muhteşem! Çok memnun kaldım.",
      verifiedPurchase: true,
      approved: true,
    });
    console.log(`✅ ${3} product review eklendi\n`);
    
    // 6. Slides
    console.log("📦 Slides ekleniyor...");
    await storage.createSlide({
      image: "/uploads/slide-1.jpg",
      title: "Yeni Sezon Ürünleri",
      subtitle: "En yeni teknoloji ürünlerini keşfedin",
      link: "/products",
      order: 1,
      active: true,
    });
    await storage.createSlide({
      image: "/uploads/slide-2.jpg",
      title: "Gaming Ürünlerinde Özel Fiyatlar",
      subtitle: "Tüm gaming ürünlerinde %20'ye varan indirimler",
      link: "/categories/gaming-urunleri",
      order: 2,
      active: true,
    });
    await storage.createSlide({
      image: "/uploads/slide-3.jpg",
      title: "Hızlı Kargo",
      subtitle: "Siparişleriniz 24 saat içinde kargoda",
      link: "/about",
      order: 3,
      active: true,
    });
    console.log(`✅ ${3} slide eklendi\n`);
    
    // 7. Blog Posts
    console.log("📦 Blog Posts ekleniyor...");
    const blogPost1 = await storage.createBlogPost({
      title: "Gaming Notebook Seçerken Dikkat Edilmesi Gerekenler",
      slug: "gaming-notebook-secerken-dikkat-edilmesi-gerekenler",
      excerpt: "Gaming notebook alırken hangi özelliklere dikkat etmelisiniz? İşlemci, ekran kartı, RAM ve daha fazlası...",
      content: `
        <h2>Gaming Notebook Seçimi</h2>
        <p>Gaming notebook seçerken dikkat edilmesi gereken en önemli faktörler:</p>
        <ul>
          <li><strong>İşlemci:</strong> Intel Core i7 veya AMD Ryzen 7 ve üzeri önerilir</li>
          <li><strong>Ekran Kartı:</strong> NVIDIA RTX 3060 veya üzeri modern oyunlar için ideal</li>
          <li><strong>RAM:</strong> En az 16GB RAM önerilir</li>
          <li><strong>Depolama:</strong> SSD kullanımı performans için kritik</li>
          <li><strong>Ekran:</strong> 144Hz veya üzeri yenileme hızı gaming için önemli</li>
        </ul>
        <p>Bu özelliklere dikkat ederek doğru gaming notebook seçimi yapabilirsiniz.</p>
      `,
      featuredImage: "/uploads/blog-gaming-notebook.jpg",
      author: "Admin",
      published: true,
      publishedAt: new Date(),
      metaTitle: "Gaming Notebook Seçerken Dikkat Edilmesi Gerekenler",
      metaDescription: "Gaming notebook alırken hangi özelliklere dikkat etmelisiniz? Detaylı rehber.",
      readingTime: 5,
    });
    
    const blogPost2 = await storage.createBlogPost({
      title: "iPhone 15 Pro Max İncelemesi",
      slug: "iphone-15-pro-max-incelemesi",
      excerpt: "Apple'ın yeni flagship telefonu iPhone 15 Pro Max'i detaylı inceledik. Titanium gövde, A17 Pro çip ve kamera performansı...",
      content: `
        <h2>iPhone 15 Pro Max İncelemesi</h2>
        <p>Apple'ın en yeni flagship telefonu iPhone 15 Pro Max, birçok yenilikle geldi.</p>
        <h3>Titanium Gövde</h3>
        <p>İlk kez titanium malzeme kullanılan iPhone 15 Pro Max, hem hafif hem de dayanıklı.</p>
        <h3>A17 Pro Çip</h3>
        <p>3nm teknoloji ile üretilen A17 Pro çip, önceki nesle göre %20 daha hızlı.</p>
        <h3>Kamera Sistemi</h3>
        <p>48MP ana kamera ile profesyonel kalitede fotoğraflar çekebilirsiniz.</p>
      `,
      featuredImage: "/uploads/blog-iphone-15.jpg",
      author: "Admin",
      published: true,
      publishedAt: new Date(),
      metaTitle: "iPhone 15 Pro Max İncelemesi - Detaylı Test",
      metaDescription: "Apple iPhone 15 Pro Max detaylı inceleme. Titanium gövde, A17 Pro çip ve kamera performansı.",
      readingTime: 8,
    });
    
    console.log(`✅ ${2} blog post eklendi\n`);
    
    // 8. Settings
    console.log("📦 Settings ekleniyor...");
    await storage.setSetting({
      key: "site_name",
      value: "Velopix",
      type: "text",
    });
    await storage.setSetting({
      key: "site_description",
      value: "Teknoloji ürünlerinde güvenilir adresiniz",
      type: "text",
    });
    await storage.setSetting({
      key: "contact_phone",
      value: "0850 123 45 67",
      type: "text",
    });
    await storage.setSetting({
      key: "contact_email",
      value: "info@velopix.com",
      type: "text",
    });
    await storage.setSetting({
      key: "contact_address",
      value: "İstanbul, Türkiye",
      type: "text",
    });
    await storage.setSetting({
      key: "free_shipping_threshold",
      value: "500",
      type: "number",
    });
    await storage.setSetting({
      key: "default_shipping_cost",
      value: "50",
      type: "number",
    });
    console.log(`✅ Settings eklendi\n`);
    
    // 9. Shipping Regions
    console.log("📦 Shipping Regions ekleniyor...");
    await storage.createShippingRegion({
      name: "İstanbul",
      cities: JSON.stringify(["İstanbul", "Kadıköy", "Beşiktaş", "Şişli", "Beyoğlu"]),
      cost: "30.00",
      order: 1,
    });
    await storage.createShippingRegion({
      name: "Ankara",
      cities: JSON.stringify(["Ankara", "Çankaya", "Keçiören", "Yenimahalle"]),
      cost: "40.00",
      order: 2,
    });
    await storage.createShippingRegion({
      name: "İzmir",
      cities: JSON.stringify(["İzmir", "Konak", "Bornova", "Karşıyaka"]),
      cost: "35.00",
      order: 3,
    });
    await storage.createShippingRegion({
      name: "Diğer Şehirler",
      cities: JSON.stringify(["Bursa", "Antalya", "Adana", "Gaziantep", "Konya"]),
      cost: "50.00",
      order: 4,
    });
    console.log(`✅ ${4} shipping region eklendi\n`);
    
    // 10. Campaigns
    console.log("📦 Campaigns ekleniyor...");
    const campaign1 = await storage.createCampaign({
      name: "weekly_products_2025_01",
      title: "Haftanın Ürünleri",
      type: "weekly",
      description: "Bu hafta öne çıkan ürünler",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün sonra
      active: true,
    });
    
    // Campaign Products
    await storage.addProductToCampaign(campaign1.id, product1.id, 0, "22999.00");
    await storage.addProductToCampaign(campaign1.id, product2.id, 1, "52999.00");
    await storage.addProductToCampaign(campaign1.id, product4.id, 2, null);
    
    console.log(`✅ ${1} campaign ve ${3} campaign product eklendi\n`);
    
    // 11. Orders
    console.log("📦 Orders ekleniyor...");
    const year = new Date().getFullYear();
    const today = new Date();
    const dateStr = `${year}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    const order1 = await storage.createOrder({
      orderNumber: `ORD-${dateStr}-000001`,
      customerName: "Ali Veli",
      customerPhone: "05551234567",
      address: "Test Mahallesi, Test Sokak No:1 Daire:2",
      city: "İstanbul",
      district: "Kadıköy",
      postalCode: "34000",
      total: "24999.00",
      shippingCost: "30.00",
      paymentMethod: "bank",
      status: "pending",
    }, [
      {
        productId: product1.id,
        internetPackageId: null,
        quantity: 1,
        price: "24999.00",
      },
    ]);
    
    const order2 = await storage.createOrder({
      orderNumber: `ORD-${dateStr}-000002`,
      customerName: "Fatma Yılmaz",
      customerPhone: "05559876543",
      address: "Örnek Caddesi, Örnek Sokak No:5",
      city: "Ankara",
      district: "Çankaya",
      postalCode: "06000",
      total: "54999.00",
      shippingCost: "40.00",
      paymentMethod: "whatsapp",
      status: "processing",
    }, [
      {
        productId: product2.id,
        internetPackageId: null,
        quantity: 1,
        price: "54999.00",
      },
    ]);
    
    const order3 = await storage.createOrder({
      orderNumber: `ORD-${dateStr}-000003`,
      customerName: "Mehmet Demir",
      customerPhone: "05551112233",
      address: "Demo Mahallesi, Demo Sokak No:10",
      city: "İzmir",
      district: "Konak",
      postalCode: "35000",
      total: "399.00",
      shippingCost: "35.00",
      paymentMethod: "bank",
      status: "completed",
    }, [
      {
        productId: null,
        internetPackageId: internetPackage2.id,
        quantity: 1,
        price: "399.00",
      },
    ]);
    
    console.log(`✅ ${3} order eklendi\n`);
    
    // 12. Repair Requests
    console.log("📦 Repair Requests ekleniyor...");
    const trackingNumber1 = "TR" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const repairRequest1 = await storage.createRepairRequest({
      trackingNumber: trackingNumber1,
      customerName: "Can Öz",
      customerPhone: "05554445566",
      customerEmail: "can.oz@example.com",
      deviceType: "Notebook",
      deviceBrand: "ASUS",
      deviceModel: "ROG Strix G15",
      deviceSerialNumber: "ASUS123456",
      problemDescription: "Ekran çalışmıyor, muhtemelen ekran kablosu sorunu",
      repairServiceId: repairService1.id,
      status: "diagnosis",
      estimatedPrice: "1500.00",
    });
    
    // Biraz bekleyelim ki tracking number farklı olsun
    await new Promise(resolve => setTimeout(resolve, 100));
    const trackingNumber2 = "TR" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const repairRequest2 = await storage.createRepairRequest({
      trackingNumber: trackingNumber2,
      customerName: "Zeynep Kaya",
      customerPhone: "05557778899",
      customerEmail: "zeynep.kaya@example.com",
      deviceType: "Cep Telefonu",
      deviceBrand: "Apple",
      deviceModel: "iPhone 13",
      problemDescription: "Ekran kırıldı, değişim gerekiyor",
      repairServiceId: repairService2.id,
      status: "price_quoted",
      finalPrice: "2500.00",
      laborCost: "500.00",
      partsCost: "2000.00",
      customerApproved: null,
    });
    
    console.log(`✅ ${2} repair request eklendi\n`);
    
    // 13. Newsletter Subscriptions
    console.log("📦 Newsletter Subscriptions ekleniyor...");
    await storage.createNewsletterSubscription({
      email: "test1@example.com",
      phone: null,
      status: "active",
    });
    await storage.createNewsletterSubscription({
      email: null,
      phone: "05551234567",
      status: "active",
    });
    console.log(`✅ ${2} newsletter subscription eklendi\n`);
    
    // 14. Contact Messages
    console.log("📦 Contact Messages ekleniyor...");
    await storage.createContactMessage({
      name: "Ahmet Yılmaz",
      email: "ahmet@example.com",
      phone: "05551234567",
      subject: "Ürün Sorgusu",
      message: "Merhaba, iPhone 15 Pro Max stokta var mı?",
      status: "new",
    });
    await storage.createContactMessage({
      name: "Ayşe Demir",
      email: "ayse@example.com",
      phone: "05559876543",
      subject: "Kargo Sorgusu",
      message: "Siparişim ne zaman kargoya verilecek?",
      status: "read",
    });
    console.log(`✅ ${2} contact message eklendi\n`);
    
    // 15. FAQs
    console.log("📦 FAQs ekleniyor...");
    await storage.createFAQ({
      question: "Kargo süresi ne kadar?",
      answer: "İstanbul içi 1-2 iş günü, diğer şehirlere 2-4 iş günü içinde teslimat yapılmaktadır.",
      category: "shipping",
      order: 1,
      active: true,
    });
    await storage.createFAQ({
      question: "Ücretsiz kargo şartı nedir?",
      answer: "500 TL ve üzeri alışverişlerde ücretsiz kargo hizmeti sunulmaktadır.",
      category: "shipping",
      order: 2,
      active: true,
    });
    await storage.createFAQ({
      question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
      answer: "Banka havalesi, kredi kartı ve WhatsApp üzerinden ödeme kabul edilmektedir.",
      category: "payment",
      order: 1,
      active: true,
    });
    await storage.createFAQ({
      question: "Ürün iadesi nasıl yapılır?",
      answer: "14 gün içinde ücretsiz iade hakkınız bulunmaktadır. Ürün orijinal ambalajında ve hasarsız olmalıdır.",
      category: "general",
      order: 1,
      active: true,
    });
    console.log(`✅ ${4} FAQ eklendi\n`);
    
    console.log("\n✅ Tüm demo veriler başarıyla eklendi!");
    console.log("\n📊 Özet:");
    console.log(`   - ${3} Repair Service`);
    console.log(`   - ${3} Internet Package`);
    console.log(`   - ${20} Product`);
    console.log(`   - Product Images`);
    console.log(`   - ${3} Product Review`);
    console.log(`   - ${3} Slide`);
    console.log(`   - ${2} Blog Post`);
    console.log(`   - Settings`);
    console.log(`   - ${4} Shipping Region`);
    console.log(`   - ${1} Campaign (${3} product ile)`);
    console.log(`   - ${3} Order`);
    console.log(`   - ${2} Repair Request`);
    console.log(`   - ${2} Newsletter Subscription`);
    console.log(`   - ${2} Contact Message`);
    console.log(`   - ${4} FAQ`);
    
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

seedDemoData();

