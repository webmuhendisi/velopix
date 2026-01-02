import "dotenv/config";
import { db } from "../server/db";
import { categories } from "@shared/schema";
import { sql } from "drizzle-orm";

async function checkDatabaseStructure() {
  try {
    console.log("🔍 Database Yapısı Kontrol Ediliyor...\n");
    
    // Categories tablosunun yapısını kontrol et
    console.log("📋 Categories Tablosu Yapısı:\n");
    
    const result = await db.execute(sql`
      DESCRIBE categories
    `);
    
    console.log("Sütunlar:");
    console.table(result);
    
    // Örnek bir kategori al ve tüm alanlarını göster
    console.log("\n📋 Örnek Kategori Verisi:\n");
    const sampleCategory = await db.select().from(categories).limit(1);
    
    if (sampleCategory.length > 0) {
      console.log("Örnek kategori:");
      console.log(JSON.stringify(sampleCategory[0], null, 2));
      
      // Tüm alanları göster
      const cat = sampleCategory[0];
      console.log("\nAlanlar:");
      console.log(`- id: ${cat.id}`);
      console.log(`- name: ${cat.name}`);
      console.log(`- slug: ${cat.slug}`);
      console.log(`- parentId: ${cat.parentId || "NULL"}`);
      console.log(`- icon: ${cat.icon || "NULL"}`);
      console.log(`- order: ${cat.order || "NULL"}`);
      console.log(`- createdAt: ${cat.createdAt}`);
      console.log(`- updatedAt: ${cat.updatedAt}`);
    } else {
      console.log("⚠️  Kategori bulunamadı");
    }
    
    // parentId'si olan ve olmayan kategorileri say
    console.log("\n📊 İstatistikler:\n");
    
    const allCategories = await db.select().from(categories);
    const withParent = allCategories.filter(c => c.parentId !== null);
    const withoutParent = allCategories.filter(c => c.parentId === null);
    
    console.log(`Toplam kategori: ${allCategories.length}`);
    console.log(`Ana kategoriler (parentId: null): ${withoutParent.length}`);
    console.log(`Alt kategoriler (parentId var): ${withParent.length}`);
    
    if (withParent.length > 0) {
      console.log("\nAlt kategori örnekleri:");
      withParent.slice(0, 5).forEach(cat => {
        console.log(`  - ${cat.name} (parentId: ${cat.parentId})`);
      });
    }
    
    console.log("\n✅ Kontrol tamamlandı!");
    
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    if (error.message.includes("parent_id")) {
      console.error("\n⚠️  'parent_id' sütunu database'de yok gibi görünüyor!");
      console.error("💡 Çözüm: 'npm run db:push' komutunu çalıştırın.");
    }
    process.exit(1);
  }
}

checkDatabaseStructure();

