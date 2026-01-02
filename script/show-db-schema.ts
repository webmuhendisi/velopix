import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function showDatabaseSchema() {
  try {
    console.log("📊 CATEGORIES TABLOSU YAPISI\n");
    console.log("=" .repeat(60));
    
    // MySQL'de tablo yapısını göster
    const result: any[] = await db.execute(sql`
      SHOW COLUMNS FROM categories
    `);
    
    console.log("\nSütunlar:\n");
    console.log("┌─────────────────────┬──────────────────────┬──────┬─────┬──────────┬─────────────────┐");
    console.log("│ Field                │ Type                 │ Null │ Key │ Default  │ Extra           │");
    console.log("├─────────────────────┼──────────────────────┼──────┼─────┼──────────┼─────────────────┤");
    
    result.forEach((row: any) => {
      const field = String(row.Field || row[0] || "").padEnd(20);
      const type = String(row.Type || row[1] || "").padEnd(21);
      const nullVal = (row.Null === "YES" ? "YES" : "NO ").padEnd(5);
      const key = String(row.Key || row[3] || "").padEnd(4);
      const defaultVal = String(row.Default || row[4] || "NULL").padEnd(10);
      const extra = String(row.Extra || row[6] || "").padEnd(15);
      
      console.log(`│ ${field} │ ${type} │ ${nullVal} │ ${key} │ ${defaultVal} │ ${extra} │`);
    });
    
    console.log("└─────────────────────┴──────────────────────┴──────┴─────┴──────────┴─────────────────┘");
    
    console.log("\n\n📋 ÖNEMLİ SÜTUNLAR:\n");
    console.log("✅ parent_id: Alt kategoriler için parent kategori ID'sini tutar");
    console.log("   - NULL ise → Ana kategori");
    console.log("   - Değer varsa → Alt kategori (değer, parent kategorinin ID'si)");
    console.log("\n✅ order: Kategorilerin sıralanması için kullanılır");
    console.log("   - Düşük sayı önce gösterilir");
    
    console.log("\n\n💡 HİYERARŞİK YAPI:\n");
    console.log("Tek bir 'categories' tablosu kullanılıyor:");
    console.log("  - parent_id = NULL  → Ana kategori");
    console.log("  - parent_id = <id>  → Alt kategori");
    console.log("\nBu yapıya 'Self-Referencing' veya 'Adjacency List' modeli denir.");
    console.log("Ayrı bir tablo gerekmez, tek tablo ile hiyerarşik yapı sağlanır.");
    
    // Örnek veriler
    console.log("\n\n📊 ÖRNEK VERİLER:\n");
    const categories = await db.execute(sql`
      SELECT id, name, slug, parent_id, \`order\`
      FROM categories
      ORDER BY \`order\`, name
      LIMIT 10
    `);
    
    if (categories.length > 0) {
      console.log("┌──────────────────────────────────┬──────────────────────┬──────────────────────┬───────┐");
      console.log("│ Name                              │ Slug                 │ Parent ID            │ Order │");
      console.log("├──────────────────────────────────┼──────────────────────┼──────────────────────┼───────┤");
      
      categories.forEach((cat: any) => {
        const name = String(cat.name || "").padEnd(33);
        const slug = String(cat.slug || "").padEnd(21);
        const parentId = (cat.parent_id || "NULL").padEnd(21);
        const order = String(cat.order || 0).padEnd(6);
        console.log(`│ ${name} │ ${slug} │ ${parentId} │ ${order} │`);
      });
      
      console.log("└──────────────────────────────────┴──────────────────────┴──────────────────────┴───────┘");
    }
    
    console.log("\n✅ Schema kontrolü tamamlandı!\n");
    
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    console.error("\nDetay:", error);
    process.exit(1);
  }
}

showDatabaseSchema();

