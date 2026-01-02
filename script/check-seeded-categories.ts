import "dotenv/config";
import { storage } from "../server/storage";

async function checkSeededCategories() {
  try {
    console.log("🔍 Seeded Kategoriler Kontrol Ediliyor...\n");
    
    // 2. El Ürünler ve alt kategorilerini kontrol et
    const allCategories = await storage.getCategories();
    
    const elUrunler = allCategories.find(c => c.slug === "2-el-urunler");
    const elNotebook = allCategories.find(c => c.slug === "2-el-notebook");
    const elCepTelefonu = allCategories.find(c => c.slug === "2-el-cep-telefonu");
    const elMasaustu = allCategories.find(c => c.slug === "2-el-masaustu-bilgisayar");
    
    console.log("📋 2. El Ürünler Kategorisi:");
    if (elUrunler) {
      console.log(JSON.stringify(elUrunler, null, 2));
      console.log(`\n   - parentId: ${elUrunler.parentId ?? "NULL (YANLIŞ - ana kategori olmalı ama parentId yok!)"}`);
      console.log(`   - order: ${elUrunler.order ?? "NULL (YANLIŞ!)"}`);
    } else {
      console.log("   ⚠️  Bulunamadı!");
    }
    
    console.log("\n📋 2. El Notebook (Alt kategori):");
    if (elNotebook) {
      console.log(JSON.stringify(elNotebook, null, 2));
      console.log(`\n   - parentId: ${elNotebook.parentId ?? "NULL (YANLIŞ - 2-el-urunler olmalı!)"}`);
      console.log(`   - order: ${elNotebook.order ?? "NULL (YANLIŞ!)"}`);
      if (elNotebook.parentId && elUrunler) {
        console.log(`   - Parent ID eşleşiyor mu: ${elNotebook.parentId === elUrunler.id ? "✅ EVET" : "❌ HAYIR"}`);
      }
    } else {
      console.log("   ⚠️  Bulunamadı!");
    }
    
    console.log("\n📋 2. El Cep Telefonu (Alt kategori):");
    if (elCepTelefonu) {
      console.log(`   - parentId: ${elCepTelefonu.parentId ?? "NULL (YANLIŞ!)"}`);
      console.log(`   - order: ${elCepTelefonu.order ?? "NULL (YANLIŞ!)"}`);
    }
    
    console.log("\n📋 2. El Masaüstü Bilgisayar (Alt kategori):");
    if (elMasaustu) {
      console.log(`   - parentId: ${elMasaustu.parentId ?? "NULL (YANLIŞ!)"}`);
      console.log(`   - order: ${elMasaustu.order ?? "NULL (YANLIŞ!)"}`);
    }
    
    // Tüm kategorilerde parentId ve order eksik olanları bul
    console.log("\n\n⚠️  EKSİK ALANLAR KONTROLÜ:\n");
    const missingParentId = allCategories.filter(c => c.parentId === null && c.slug !== "urunler" && !["urunler", "bilgisayar", "telefonlar", "bilgisayar-parcalari", "gaming-urunleri", "ag-urunleri", "kulakliklar-ve-hoparlorler"].some(s => c.slug.startsWith(s)));
    const missingOrder = allCategories.filter(c => c.order === null || c.order === undefined);
    
    console.log(`parentId eksik olanlar (muhtemelen alt kategori olmalı): ${missingParentId.length}`);
    missingParentId.slice(0, 5).forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });
    
    console.log(`\norder eksik olanlar: ${missingOrder.length}`);
    missingOrder.slice(0, 5).forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });
    
    console.log("\n✅ Kontrol tamamlandı!");
    
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    console.error(error);
    process.exit(1);
  }
}

checkSeededCategories();

