import "dotenv/config";
import { storage } from "../server/storage";

async function createAdmin() {
  const username = process.argv[2] || "admin";
  const password = process.argv[3] || "admin123";

  try {
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log(`❌ Kullanıcı "${username}" zaten mevcut!`);
      process.exit(1);
    }

    const user = await storage.createUser({
      username,
      password,
      role: "admin",
    });

    console.log(`✅ Admin kullanıcısı oluşturuldu!`);
    console.log(`   Kullanıcı Adı: ${user.username}`);
    console.log(`   Şifre: ${password}`);
    console.log(`   ID: ${user.id}`);
    console.log(`\n📝 Admin panele giriş: http://localhost:${process.env.PORT || 5000}/admin/login`);
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

createAdmin();

