import "dotenv/config";
import { storage } from "../server/storage";
import bcrypt from "bcryptjs";

async function debugLogin() {
  try {
    console.log("🔍 Login debug başlatılıyor...\n");
    
    const username = "admin";
    const password = "admin123";
    
    // 1. Kullanıcıyı bul
    console.log("1️⃣ Kullanıcı aranıyor...");
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.log("❌ Kullanıcı bulunamadı!");
      process.exit(1);
    }
    
    console.log("✅ Kullanıcı bulundu:");
    console.log(`   Username: ${user.username}`);
    console.log(`   Password Hash: ${user.password}`);
    console.log(`   Hash Length: ${user.password.length}`);
    console.log(`   Hash Starts With: ${user.password.substring(0, 7)}`);
    
    // 2. Password hash kontrolü
    console.log("\n2️⃣ Password hash kontrolü...");
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log("✅ Password doğru! Login başarılı olmalı.");
    } else {
      console.log("❌ Password yanlış!");
      console.log("\n🔧 Olası sorunlar:");
      console.log("   - Şifre hash'lenirken bir sorun olmuş olabilir");
      console.log("   - Veritabanındaki hash bozuk olabilir");
      console.log("\n💡 Çözüm:");
      console.log("   npm run create-admin admin yenisifre");
    }
    
    // 3. Yeni hash oluştur (test)
    console.log("\n3️⃣ Yeni hash testi...");
    const testHash = await bcrypt.hash(password, 10);
    const testCompare = await bcrypt.compare(password, testHash);
    console.log(`   Test Hash: ${testHash.substring(0, 30)}...`);
    console.log(`   Test Compare: ${testCompare ? "✅ Başarılı" : "❌ Başarısız"}`);
    
    console.log("\n✅ Debug tamamlandı!");
    
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugLogin();

