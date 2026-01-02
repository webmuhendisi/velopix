import "dotenv/config";
import { storage } from "../server/storage";
import { randomUUID } from "crypto";

interface CategoryData {
  name: string;
  slug: string;
  parentSlug?: string;
  order?: number;
}

// Kategori yapısı - HTML'den çıkarılan hiyerarşi (görseldeki menü yapısına göre)
const categoryData: CategoryData[] = [
  // Ana kategoriler (görseldeki menüde görünenler)
  { name: "Ürünler", slug: "urunler", order: 1 },
  { name: "Bilgisayar", slug: "bilgisayar", order: 2 },
  { name: "Telefonlar", slug: "telefonlar", order: 3 },
  { name: "Bilgisayar Parçaları", slug: "bilgisayar-parcalari", order: 4 },
  { name: "Gaming Ürünleri", slug: "gaming-urunleri", order: 5 },
  { name: "Ağ Ürünleri", slug: "ag-urunleri", order: 6 },
  { name: "Kulaklıklar ve Hoparlörler", slug: "kulakliklar-ve-hoparlorler", order: 7 },
  
  // Ürünler ana kategorisi altında kategoriler
  { name: "TV ve Ürünleri", slug: "tv-ve-urunleri", parentSlug: "urunler", order: 1 },
  { name: "2. El Ürünler", slug: "2-el-urunler", parentSlug: "urunler", order: 2 },
  { name: "Bilgisayar ve Tablet", slug: "bilgisayar-ve-tablet", parentSlug: "urunler", order: 3 },
  { name: "Ev ve Yaşam", slug: "ev-ve-yasam", parentSlug: "urunler", order: 4 },
  { name: "Ofis ve Kırtasiye", slug: "ofis-ve-kirtasiye", parentSlug: "urunler", order: 5 },
  { name: "Güvenlik Ürünleri", slug: "guvenlik-urunleri", parentSlug: "urunler", order: 6 },
  { name: "Çevre Birimleri", slug: "cevre-birimleri", parentSlug: "urunler", order: 7 },
  { name: "PC Bileşenleri", slug: "pc-bilesenleri", parentSlug: "urunler", order: 8 },
  { name: "Oyun ve Hobi", slug: "oyun-ve-hobi", parentSlug: "urunler", order: 9 },
  { name: "Telefon ve Aksesuarları", slug: "telefon-ve-aksesuarlari", parentSlug: "urunler", order: 10 },
  { name: "İnternet Satışları", slug: "internet-satislari", parentSlug: "urunler", order: 11 },
  
  // NOT: Gaming Ürünleri ve Ağ Ürünleri ana kategoriler olarak ayrı tanımlı, 
  // bu yüzden "Ürünler" altında alt kategorileri yok
  
  // TV ve Ürünleri alt kategorileri
  { name: "Televizyon", slug: "televizyon", parentSlug: "tv-ve-urunleri", order: 1 },
  { name: "Projeksiyon", slug: "projeksiyon", parentSlug: "tv-ve-urunleri", order: 2 },
  { name: "Sinema Sistemi", slug: "sinema-sistemi", parentSlug: "tv-ve-urunleri", order: 3 },
  { name: "Media Player", slug: "media-player", parentSlug: "tv-ve-urunleri", order: 4 },
  { name: "TV Askı Aparatı", slug: "tv-aski-aparati", parentSlug: "tv-ve-urunleri", order: 5 },
  { name: "Uydu Sistemleri", slug: "uydu-sistemleri", parentSlug: "tv-ve-urunleri", order: 6 },
  { name: "TV Aksesuar", slug: "tv-aksesuar", parentSlug: "tv-ve-urunleri", order: 7 },
  { name: "Müzik ve Ses Sistemleri", slug: "muzik-ve-ses-sistemleri", parentSlug: "tv-ve-urunleri", order: 8 },
  
  // 2. El Ürünler alt kategorileri
  { name: "2. El Notebook", slug: "2-el-notebook", parentSlug: "2-el-urunler", order: 1 },
  { name: "2. El Cep Telefonu", slug: "2-el-cep-telefonu", parentSlug: "2-el-urunler", order: 2 },
  { name: "2. El Masaüstü Bilgisayar", slug: "2-el-masaustu-bilgisayar", parentSlug: "2-el-urunler", order: 3 },
  
  // Bilgisayar ve Tablet alt kategorileri
  { name: "Notebook", slug: "notebook", parentSlug: "bilgisayar-ve-tablet", order: 1 },
  { name: "Masaüstü PC", slug: "masaustu-pc", parentSlug: "bilgisayar-ve-tablet", order: 2 },
  { name: "Hazır Sistemler", slug: "hazir-sistemler", parentSlug: "bilgisayar-ve-tablet", order: 3 },
  { name: "All İn One PC", slug: "all-in-one-pc", parentSlug: "bilgisayar-ve-tablet", order: 4 },
  { name: "Bilgisayar Kasası", slug: "bilgisayar-kasasi", parentSlug: "bilgisayar-ve-tablet", order: 5 },
  { name: "Tablet", slug: "tablet", parentSlug: "bilgisayar-ve-tablet", order: 6 },
  { name: "Tablet Aksesuarı", slug: "tablet-aksesuari", parentSlug: "bilgisayar-ve-tablet", order: 7 },
  { name: "Notebook Aksesuar", slug: "notebook-aksesuar", parentSlug: "bilgisayar-ve-tablet", order: 8 },
  { name: "Yazılımlar", slug: "yazilimlar", parentSlug: "bilgisayar-ve-tablet", order: 9 },
  { name: "Sunucular", slug: "sunucular", parentSlug: "bilgisayar-ve-tablet", order: 10 },
  { name: "Veri Depolama", slug: "veri-depolama", parentSlug: "bilgisayar-ve-tablet", order: 11 },
  { name: "Kablo ve Dönüştürücüler", slug: "kablo-ve-donusturuculer", parentSlug: "bilgisayar-ve-tablet", order: 12 },
  { name: "Mini PC", slug: "mini-pc", parentSlug: "bilgisayar-ve-tablet", order: 13 },
  
  // Ev ve Yaşam alt kategorileri
  { name: "Robot Süpürge", slug: "robot-supurge", parentSlug: "ev-ve-yasam", order: 1 },
  { name: "Kişisel Bakım", slug: "kisisel-bakim", parentSlug: "ev-ve-yasam", order: 2 },
  
  // Ofis ve Kırtasiye alt kategorileri
  { name: "Barkod Okuyucu", slug: "barkod-okuyucu", parentSlug: "ofis-ve-kirtasiye", order: 1 },
  { name: "Termos", slug: "termos", parentSlug: "ofis-ve-kirtasiye", order: 2 },
  { name: "Toner ve Kartuş", slug: "toner-ve-kartus", parentSlug: "ofis-ve-kirtasiye", order: 3 },
  
  // Güvenlik Ürünleri alt kategorileri
  { name: "Kayıt Cihazları", slug: "kayit-cihazlari", parentSlug: "guvenlik-urunleri", order: 1 },
  { name: "Kameralar", slug: "kameralar", parentSlug: "guvenlik-urunleri", order: 2 },
  { name: "Kontrol Sistemleri", slug: "kontrol-sistemleri", parentSlug: "guvenlik-urunleri", order: 3 },
  { name: "Alarm Setleri", slug: "alarm-setleri", parentSlug: "guvenlik-urunleri", order: 4 },
  { name: "Güvenlik Aksesuarları", slug: "guvenlik-aksesuarlari", parentSlug: "guvenlik-urunleri", order: 5 },
  { name: "Akıllı Ev Sistemleri", slug: "akilli-ev-sistemleri", parentSlug: "guvenlik-urunleri", order: 6 },
  
  // Çevre Birimleri alt kategorileri
  { name: "Monitörler", slug: "monitorler-cevre", parentSlug: "cevre-birimleri", order: 1 },
  { name: "Klavyeler", slug: "klavyeler-cevre", parentSlug: "cevre-birimleri", order: 2 },
  { name: "Mikrofonlar", slug: "mikrofonlar", parentSlug: "cevre-birimleri", order: 3 },
  { name: "Mouse", slug: "mouse-cevre", parentSlug: "cevre-birimleri", order: 4 },
  { name: "Mouse Pad", slug: "mouse-pad-cevre", parentSlug: "cevre-birimleri", order: 5 },
  { name: "Klavye Mouse Seti", slug: "klavye-mouse-seti-cevre", parentSlug: "cevre-birimleri", order: 6 },
  { name: "Web Camera", slug: "web-camera", parentSlug: "cevre-birimleri", order: 7 },
  { name: "Kulaklık Standı", slug: "kulaklik-standi", parentSlug: "cevre-birimleri", order: 8 },
  { name: "Kasa Fanı", slug: "kasa-fani", parentSlug: "cevre-birimleri", order: 9 },
  { name: "Hoparlör", slug: "hoparlor-cevre", parentSlug: "cevre-birimleri", order: 10 },
  { name: "UPS", slug: "ups", parentSlug: "cevre-birimleri", order: 11 },
  { name: "Çoklayıcılar", slug: "coklayicilar", parentSlug: "cevre-birimleri", order: 12 },
  { name: "Monitör Aparatları", slug: "monitor-aparatlari", parentSlug: "cevre-birimleri", order: 13 },
  
  // PC Bileşenleri alt kategorileri
  { name: "İşlemciler", slug: "islemciler-pc", parentSlug: "pc-bilesenleri", order: 1 },
  { name: "Ekran Kartları", slug: "ekran-kartlari-pc", parentSlug: "pc-bilesenleri", order: 2 },
  { name: "Anakartlar", slug: "anakartlar-pc", parentSlug: "pc-bilesenleri", order: 3 },
  { name: "Bilgisayar Bellek (RAM)", slug: "bilgisayar-bellek-ram-pc", parentSlug: "pc-bilesenleri", order: 4 },
  { name: "Güç Kaynakları", slug: "guc-kaynaklari", parentSlug: "pc-bilesenleri", order: 5 },
  { name: "Soğutma Sistemleri", slug: "sogutma-sistemleri", parentSlug: "pc-bilesenleri", order: 6 },
  { name: "Optik Sürücüler", slug: "optik-suruculer", parentSlug: "pc-bilesenleri", order: 7 },
  
  // Oyun ve Hobi alt kategorileri
  { name: "Drone", slug: "drone", parentSlug: "oyun-ve-hobi", order: 1 },
  { name: "Scooter", slug: "scooter", parentSlug: "oyun-ve-hobi", order: 2 },
  { name: "Playstation ve Oyun Kolları", slug: "playstation-ve-oyun-kollari", parentSlug: "oyun-ve-hobi", order: 3 },
  { name: "XBox", slug: "xbox", parentSlug: "oyun-ve-hobi", order: 4 },
  { name: "Oyunlar", slug: "oyunlar", parentSlug: "oyun-ve-hobi", order: 5 },
  { name: "Sanal Gerçeklik", slug: "sanal-gerceklik", parentSlug: "oyun-ve-hobi", order: 6 },
  { name: "Aksiyon Kameraları", slug: "aksiyon-kameralari", parentSlug: "oyun-ve-hobi", order: 7 },
  
  // Telefon ve Aksesuarları alt kategorileri
  { name: "Telefon Aksesuarları", slug: "telefon-aksesuarlari", parentSlug: "telefon-ve-aksesuarlari", order: 1 },
  { name: "Taşınabilir Sarj - Powerbank", slug: "tasinabilir-sarj-powerbank", parentSlug: "telefon-ve-aksesuarlari", order: 2 },
  { name: "Masaüstü Telefon", slug: "masaustu-telefon", parentSlug: "telefon-ve-aksesuarlari", order: 3 },
  { name: "Şarj Aletleri", slug: "sarj-aletleri", parentSlug: "telefon-ve-aksesuarlari", order: 4 },
  { name: "Telefon Kılıfları", slug: "telefon-kiliflari", parentSlug: "telefon-ve-aksesuarlari", order: 5 },
  { name: "Ekran Koruyucu", slug: "ekran-koruyucu", parentSlug: "telefon-ve-aksesuarlari", order: 6 },
  { name: "Telefon Tutacağı", slug: "telefon-tutacagi", parentSlug: "telefon-ve-aksesuarlari", order: 7 },
  { name: "Araç Sarj Kiti", slug: "arac-sarj-kiti", parentSlug: "telefon-ve-aksesuarlari", order: 8 },
  { name: "Kamera Lensleri", slug: "kamera-lensleri", parentSlug: "telefon-ve-aksesuarlari", order: 9 },
  { name: "Cep Telefonları", slug: "cep-telefonlari", parentSlug: "telefon-ve-aksesuarlari", order: 10 },
  { name: "Bluetooth Kulaklık", slug: "bluetooth-kulaklik", parentSlug: "telefon-ve-aksesuarlari", order: 11 },
  { name: "Akıllı Saat", slug: "akilli-saat", parentSlug: "telefon-ve-aksesuarlari", order: 12 },
  { name: "Akıllı Bileklik", slug: "akilli-bileklik", parentSlug: "telefon-ve-aksesuarlari", order: 13 },
  { name: "Bluetooth Hoparlör", slug: "bluetooth-hoparlor", parentSlug: "telefon-ve-aksesuarlari", order: 14 },
  
  // Bilgisayar ana kategorisi altında kategoriler
  { name: "Notebook", slug: "notebook-bilgisayar", parentSlug: "bilgisayar", order: 1 },
  { name: "Hazır Sistemler", slug: "hazir-sistemler-bilgisayar", parentSlug: "bilgisayar", order: 2 },
  { name: "Masaüstü PC", slug: "masaustu-pc-bilgisayar", parentSlug: "bilgisayar", order: 3 },
  { name: "All İn One PC", slug: "all-in-one-pc-bilgisayar", parentSlug: "bilgisayar", order: 4 },
  { name: "Mini PC", slug: "mini-pc-bilgisayar", parentSlug: "bilgisayar", order: 5 },
  { name: "Tablet", slug: "tablet-bilgisayar", parentSlug: "bilgisayar", order: 6 },
  { name: "Notebook Aksesuar", slug: "notebook-aksesuar-bilgisayar", parentSlug: "bilgisayar", order: 7 },
  { name: "Veri Depolama", slug: "veri-depolama-bilgisayar", parentSlug: "bilgisayar", order: 8 },
  { name: "Kablo ve Dönüştürücüler", slug: "kablo-ve-donusturuculer-bilgisayar", parentSlug: "bilgisayar", order: 9 },
  { name: "Bilgisayar Kasası", slug: "bilgisayar-kasasi-bilgisayar", parentSlug: "bilgisayar", order: 10 },
  
  // Telefonlar ana kategorisi altında kategoriler
  { name: "Cep Telefonları", slug: "cep-telefonlari-telefonlar", parentSlug: "telefonlar", order: 1 },
  { name: "Bluetooth Kulaklık", slug: "bluetooth-kulaklik-telefonlar", parentSlug: "telefonlar", order: 2 },
  { name: "Akıllı Saat", slug: "akilli-saat-telefonlar", parentSlug: "telefonlar", order: 3 },
  { name: "Bluetooth Hoparlör", slug: "bluetooth-hoparlor-telefonlar", parentSlug: "telefonlar", order: 4 },
  { name: "Şarj Aletleri", slug: "sarj-aletleri-telefonlar", parentSlug: "telefonlar", order: 5 },
  { name: "Powerbank", slug: "powerbank-telefonlar", parentSlug: "telefonlar", order: 6 },
  { name: "Telefon Kılıfları", slug: "telefon-kiliflari-telefonlar", parentSlug: "telefonlar", order: 7 },
  { name: "Ekran Koruyucu", slug: "ekran-koruyucu-telefonlar", parentSlug: "telefonlar", order: 8 },
  { name: "Araç Şarj Kiti", slug: "arac-sarj-kiti-telefonlar", parentSlug: "telefonlar", order: 9 },
  
  // Bilgisayar Parçaları ana kategorisi altında kategoriler
  { name: "Monitörler", slug: "monitorler-parcalar", parentSlug: "bilgisayar-parcalari", order: 1 },
  { name: "Klavyeler", slug: "klavyeler-parcalar", parentSlug: "bilgisayar-parcalari", order: 2 },
  { name: "Mouse", slug: "mouse-parcalar", parentSlug: "bilgisayar-parcalari", order: 3 },
  { name: "Mouse Pad", slug: "mouse-pad-parcalar", parentSlug: "bilgisayar-parcalari", order: 4 },
  { name: "Klavye Mouse Seti", slug: "klavye-mouse-seti-parcalar", parentSlug: "bilgisayar-parcalari", order: 5 },
  { name: "Hoparlörler", slug: "hoparlorler-parcalar", parentSlug: "bilgisayar-parcalari", order: 6 },
  { name: "İşlemciler", slug: "islemciler-parcalar", parentSlug: "bilgisayar-parcalari", order: 7 },
  { name: "Ekran Kartları", slug: "ekran-kartlari-parcalar", parentSlug: "bilgisayar-parcalari", order: 8 },
  { name: "Anakartlar", slug: "anakartlar-parcalar", parentSlug: "bilgisayar-parcalari", order: 9 },
  { name: "RAM", slug: "ram-parcalar", parentSlug: "bilgisayar-parcalari", order: 10 },
  
  // Gaming Ürünleri ana kategorisi altında kategoriler
  { name: "Gaming Notebook", slug: "gaming-notebook-ana", parentSlug: "gaming-urunleri", order: 1 },
  { name: "Gaming Monitör", slug: "gaming-monitor-ana", parentSlug: "gaming-urunleri", order: 2 },
  { name: "Gaming Masa", slug: "gaming-masa-ana", parentSlug: "gaming-urunleri", order: 3 },
  { name: "Gaming Klavye", slug: "gaming-klavye-ana", parentSlug: "gaming-urunleri", order: 4 },
  { name: "Gaming Kulaklık", slug: "gaming-kulaklik-gaming", parentSlug: "gaming-urunleri", order: 5 },
  { name: "Gaming Mouse", slug: "gaming-mouse-ana", parentSlug: "gaming-urunleri", order: 6 },
  { name: "Gaming Mousepad", slug: "gaming-mousepad-ana", parentSlug: "gaming-urunleri", order: 7 },
  { name: "Playstation ve Oyun Kolları", slug: "playstation-ve-oyun-kollari-gaming", parentSlug: "gaming-urunleri", order: 8 },
  
  // Ağ Ürünleri ana kategorisi altında kategoriler
  { name: "Modemler", slug: "modemler-ana", parentSlug: "ag-urunleri", order: 1 },
  { name: "Switchler", slug: "switchler-ana", parentSlug: "ag-urunleri", order: 2 },
  { name: "Menzil Genişletici", slug: "menzil-genisletici-ana", parentSlug: "ag-urunleri", order: 3 },
  { name: "Ağ Aksesuarları", slug: "ag-aksesuarlari-ana", parentSlug: "ag-urunleri", order: 4 },
  
  // Kulaklıklar ve Hoparlörler ana kategorisi altında kategoriler
  { name: "Bluetooth Kulaklık", slug: "bluetooth-kulaklik-kulakliklar", parentSlug: "kulakliklar-ve-hoparlorler", order: 1 },
  { name: "Bluetooth Hoparlör", slug: "bluetooth-hoparlor-kulakliklar", parentSlug: "kulakliklar-ve-hoparlorler", order: 2 },
  { name: "Gaming Kulaklık", slug: "gaming-kulaklik-kulakliklar", parentSlug: "kulakliklar-ve-hoparlorler", order: 3 },
  { name: "PC Hoparlörler", slug: "pc-hoparlorler", parentSlug: "kulakliklar-ve-hoparlorler", order: 4 },
];

async function seedCategories() {
  try {
    console.log("🗑️  Mevcut kategoriler siliniyor...\n");
    
    // Önce order_items ve campaign_products'ı sil (ürünleri silmeden önce)
    console.log("📦 Order items ve campaign products temizleniyor...");
    const { db } = await import("../server/db");
    const { orderItems, campaignProducts } = await import("../shared/schema");
    const { sql } = await import("drizzle-orm");
    
    await db.delete(orderItems);
    await db.delete(campaignProducts);
    console.log("✅ Order items ve campaign products temizlendi\n");
    
    // Şimdi tüm ürünleri sil (kategorileri silmeden önce)
    console.log("📦 Kategorilere ait ürünler siliniyor...");
    const allProducts = await storage.getProducts();
    for (const product of allProducts) {
      try {
        await storage.deleteProduct(product.id);
      } catch (error: any) {
        console.log(`⚠️  Ürün "${product.title}" silinirken hata: ${error.message}`);
      }
    }
    console.log(`✅ ${allProducts.length} ürün silindi\n`);
    
    // Önce tüm kategorileri al
    const existingCategories = await storage.getCategories();
    
    // Recursive olarak sil: önce alt kategorileri, sonra ana kategorileri
    const deleteCategoryRecursive = async (categoryId: string) => {
      // Önce alt kategorileri bul ve sil
      const children = await storage.getCategoriesByParent(categoryId);
      for (const child of children) {
        await deleteCategoryRecursive(child.id);
      }
      // Sonra kendisini sil
      try {
        await storage.deleteCategory(categoryId);
        const category = existingCategories.find(c => c.id === categoryId);
        console.log(`🗑️  "${category?.name || categoryId}" silindi`);
      } catch (error: any) {
        const category = existingCategories.find(c => c.id === categoryId);
        console.log(`⚠️  "${category?.name || categoryId}" silinirken hata: ${error.message}`);
      }
    };
    
    // Önce ana kategorileri (parentId null olanlar) bul
    const rootCategories = existingCategories.filter(c => !c.parentId);
    
    // Ana kategorileri recursive olarak sil
    for (const category of rootCategories) {
      await deleteCategoryRecursive(category.id);
    }
    
    // Kalan kategorileri de sil (eğer varsa)
    const leftCategories = await storage.getCategories();
    for (const category of leftCategories) {
      try {
        await storage.deleteCategory(category.id);
        console.log(`🗑️  "${category.name}" silindi`);
      } catch (error: any) {
        console.log(`⚠️  "${category.name}" silinirken hata: ${error.message}`);
      }
    }
    
    console.log("\n🌱 AŞAMA 1: Ana kategoriler oluşturuluyor...\n");
    
    // Slug'dan ID'ye mapping oluştur
    const slugToId = new Map<string, string>();
    
    // ÖNCE: Sadece ana kategorileri oluştur (parentSlug'ı olmayanlar)
    const topLevelCategories = categoryData.filter(cat => !cat.parentSlug);
    
    for (const catData of topLevelCategories) {
      const category = await storage.createCategory({
        name: catData.name,
        slug: catData.slug,
        parentId: null,
        icon: null,
        order: catData.order || 0,
      });
      
      slugToId.set(catData.slug, category.id);
      console.log(`✅ Ana kategori: "${catData.name}" oluşturuldu (ID: ${category.id})`);
    }
    
    console.log(`\n📊 ${topLevelCategories.length} ana kategori oluşturuldu.\n`);
    
    console.log("🌱 AŞAMA 2: Alt kategoriler oluşturuluyor...\n");
    
    // SONRA: Alt kategorileri oluştur (parentSlug'ı olanlar)
    // Önce birinci seviye alt kategoriler, sonra ikinci seviye, vs.
    const subCategories = categoryData.filter(cat => cat.parentSlug);
    
    // Seviye bazlı sıralama: önce birinci seviye alt kategoriler
    let pendingCategories = [...subCategories];
    let level = 1;
    
    while (pendingCategories.length > 0) {
      const currentLevelCategories = pendingCategories.filter(cat => {
        const parentExists = slugToId.has(cat.parentSlug!);
        return parentExists;
      });
      
      if (currentLevelCategories.length === 0) {
        console.log(`⚠️  Kalan ${pendingCategories.length} kategori için parent bulunamadı!`);
        break;
      }
      
      console.log(`\n📦 Seviye ${level} alt kategoriler (${currentLevelCategories.length} adet):\n`);
      
      for (const catData of currentLevelCategories) {
        const parentId = slugToId.get(catData.parentSlug!);
        
        if (!parentId) {
          console.log(`⚠️  "${catData.name}" için parent bulunamadı: ${catData.parentSlug}`);
          continue;
        }
        
        const category = await storage.createCategory({
          name: catData.name,
          slug: catData.slug,
          parentId: parentId,
          icon: null,
          order: catData.order || 0,
        });
        
        slugToId.set(catData.slug, category.id);
        const parentName = categoryData.find(c => c.slug === catData.parentSlug)?.name || catData.parentSlug;
        console.log(`✅ "${catData.name}" -> "${parentName}" altında oluşturuldu`);
      }
      
      // Oluşturulan kategorileri listeden çıkar
      pendingCategories = pendingCategories.filter(
        cat => !currentLevelCategories.includes(cat)
      );
      
      level++;
    }
    
    console.log("\n✅ Tüm kategoriler başarıyla eklendi!");
    console.log(`📊 Toplam ${categoryData.length} kategori eklendi.`);
    console.log(`   - ${topLevelCategories.length} ana kategori`);
    console.log(`   - ${subCategories.length} alt kategori`);
    
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

seedCategories();

