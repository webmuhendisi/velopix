import "dotenv/config";
import { storage } from "../server/storage";

async function checkCategories() {
  try {
    console.log("🔍 Kategori Sistemi Kontrol Ediliyor...\n");
    
    // 1. Tüm kategorileri al
    console.log("📋 1. Tüm Kategoriler:");
    const allCategories = await storage.getCategories();
    console.log(`   Toplam: ${allCategories.length} kategori\n`);
    
    // 2. Ana kategorileri al (parentId: null)
    console.log("📋 2. Ana Kategoriler (parentId: null):");
    const mainCategories = await storage.getCategoriesByParent(null);
    console.log(`   Toplam: ${mainCategories.length} ana kategori`);
    mainCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - Order: ${cat.order || 0}`);
    });
    console.log();
    
    // 3. Her ana kategorinin alt kategorilerini kontrol et
    console.log("📋 3. Ana Kategorilerin Alt Kategorileri:");
    for (const mainCat of mainCategories) {
      const children = await storage.getCategoriesByParent(mainCat.id);
      console.log(`\n   📁 ${mainCat.name} (${mainCat.slug}):`);
      if (children.length === 0) {
        console.log(`      ⚠️  Alt kategori yok`);
      } else {
        console.log(`      ✅ ${children.length} alt kategori:`);
        children.forEach((child, idx) => {
          console.log(`         ${idx + 1}. ${child.name} (${child.slug}) - Order: ${child.order || 0}`);
        });
      }
    }
    console.log();
    
    // 4. Hiyerarşik yapıyı kontrol et
    console.log("📋 4. Hiyerarşik Yapı:");
    const hierarchical = await storage.getCategoriesHierarchical();
    console.log(`   Toplam: ${hierarchical.length} ana kategori (hierarchical)`);
    
    function printHierarchy(cats: any[], level: number = 0) {
      for (const cat of cats) {
        const indent = "  ".repeat(level);
        const hasChildren = cat.children && cat.children.length > 0;
        const icon = hasChildren ? "📁" : "📄";
        console.log(`${indent}${icon} ${cat.name} (${cat.slug})`);
        if (hasChildren) {
          printHierarchy(cat.children, level + 1);
        }
      }
    }
    
    printHierarchy(hierarchical);
    console.log();
    
    // 5. Veri bütünlüğü kontrolü
    console.log("📋 5. Veri Bütünlüğü Kontrolü:");
    
    // ParentId'si olan ama parent'ı bulunamayan kategoriler
    const orphanCategories: any[] = [];
    for (const cat of allCategories) {
      if (cat.parentId) {
        const parent = allCategories.find(c => c.id === cat.parentId);
        if (!parent) {
          orphanCategories.push(cat);
        }
      }
    }
    
    if (orphanCategories.length > 0) {
      console.log(`   ⚠️  ${orphanCategories.length} kategori için parent bulunamadı:`);
      orphanCategories.forEach(cat => {
        console.log(`      - ${cat.name} (${cat.slug}) - parentId: ${cat.parentId}`);
      });
    } else {
      console.log("   ✅ Tüm kategorilerin parent'ları mevcut");
    }
    
    // Duplicate slug kontrolü (database'de zaten unique constraint var ama kontrol edelim)
    const slugs = allCategories.map(c => c.slug);
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicateSlugs.length > 0) {
      console.log(`   ⚠️  Duplicate slug'lar bulundu: ${duplicateSlugs.join(", ")}`);
    } else {
      console.log("   ✅ Tüm slug'lar unique");
    }
    
    // 6. Özet
    console.log("\n📊 Özet:");
    console.log(`   - Toplam kategori: ${allCategories.length}`);
    console.log(`   - Ana kategori: ${mainCategories.length}`);
    console.log(`   - Alt kategori: ${allCategories.length - mainCategories.length}`);
    console.log(`   - Hiyerarşik ana kategori: ${hierarchical.length}`);
    
    const maxDepth = (cats: any[], depth: number = 0): number => {
      if (!cats || cats.length === 0) return depth;
      return Math.max(...cats.map(cat => {
        if (cat.children && cat.children.length > 0) {
          return maxDepth(cat.children, depth + 1);
        }
        return depth;
      }));
    };
    
    const depth = maxDepth(hierarchical);
    console.log(`   - Maksimum derinlik: ${depth} seviye`);
    
    console.log("\n✅ Kontrol tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

checkCategories();

