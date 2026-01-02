import "dotenv/config";
import { storage } from "../server/storage";

async function testCategoryAPI() {
  try {
    console.log("🔍 Kategori API Test\n");
    
    // Tüm kategorileri al
    console.log("1. Tüm kategoriler (getCategories):");
    const allCategories = await storage.getCategories();
    console.log(`   Toplam: ${allCategories.length} kategori\n`);
    
    if (allCategories.length > 0) {
      const sample = allCategories[0];
      console.log("   Örnek kategori:");
      console.log(JSON.stringify(sample, null, 2));
      console.log("\n   Alanlar:");
      console.log(`   - id: ${sample.id}`);
      console.log(`   - name: ${sample.name}`);
      console.log(`   - slug: ${sample.slug}`);
      console.log(`   - parentId: ${sample.parentId ?? "NULL (eksik!)"}`);
      console.log(`   - order: ${sample.order ?? "NULL (eksik!)"}`);
      console.log(`   - icon: ${sample.icon ?? "NULL"}`);
      console.log(`   - createdAt: ${sample.createdAt}`);
      console.log(`   - updatedAt: ${sample.updatedAt}`);
    }
    
    // Ana kategorileri al
    console.log("\n2. Ana kategoriler (getCategoriesByParent(null)):");
    const mainCategories = await storage.getCategoriesByParent(null);
    console.log(`   Toplam: ${mainCategories.length} ana kategori\n`);
    
    if (mainCategories.length > 0) {
      const sample = mainCategories[0];
      console.log("   Örnek ana kategori:");
      console.log(`   - id: ${sample.id}`);
      console.log(`   - name: ${sample.name}`);
      console.log(`   - parentId: ${sample.parentId ?? "NULL (doğru)"}`);
      console.log(`   - order: ${sample.order ?? "NULL (eksik!)"}`);
    }
    
    // Alt kategorileri al
    if (allCategories.length > 0) {
      const firstCategory = allCategories[0];
      if (firstCategory.id) {
        console.log(`\n3. Alt kategoriler (getCategoriesByParent("${firstCategory.id}")):`);
        const children = await storage.getCategoriesByParent(firstCategory.id);
        console.log(`   Toplam: ${children.length} alt kategori\n`);
        
        if (children.length > 0) {
          const sample = children[0];
          console.log("   Örnek alt kategori:");
          console.log(`   - id: ${sample.id}`);
          console.log(`   - name: ${sample.name}`);
          console.log(`   - parentId: ${sample.parentId ?? "NULL (eksik!)"}`);
          console.log(`   - order: ${sample.order ?? "NULL (eksik!)"}`);
        }
      }
    }
    
    console.log("\n✅ Test tamamlandı!");
    
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testCategoryAPI();

