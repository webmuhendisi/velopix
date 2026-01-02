import "dotenv/config";
import { storage } from "../server/storage";

async function testAdmin() {
  try {
    console.log("🔍 Admin kullanıcılarını kontrol ediliyor...\n");
    
    const adminUser = await storage.getUserByUsername("admin");
    
    if (!adminUser) {
      console.log("❌ Admin kullanıcısı bulunamadı!");
      console.log("💡 Çözüm: npm run create-admin komutunu çalıştırın");
      process.exit(1);
    }
    
    console.log("✅ Admin kullanıcısı bulundu:");
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Password Hash: ${adminUser.password.substring(0, 20)}...`);
    console.log(`   Created: ${adminUser.createdAt}`);
    console.log("\n✅ Veritabanı bağlantısı çalışıyor!");
    console.log("\n📝 Şimdi admin panele giriş yapabilirsiniz:");
    console.log(`   URL: http://localhost:${process.env.PORT || 5000}/admin/login`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: admin123 (veya oluştururken verdiğiniz şifre)`);
    
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    console.error("\n🔧 Olası sorunlar:");
    console.error("   1. DATABASE_URL environment variable doğru mu?");
    console.error("   2. MySQL veritabanı çalışıyor mu?");
    console.error("   3. Veritabanı tabloları oluşturuldu mu? (npm run db:push)");
    console.error("   4. Veritabanı bağlantısı başarılı mı?");
    process.exit(1);
  }
}

testAdmin();

