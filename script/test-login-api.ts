import "dotenv/config";

async function testLoginAPI() {
  const baseUrl = process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3005";
  
  console.log("🔍 Login API testi başlatılıyor...\n");
  console.log(`📍 Test URL: ${baseUrl}/api/admin/login\n`);
  
  try {
    // Test 1: Boş request
    console.log("1️⃣ Test: Boş request");
    const emptyRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const emptyData = await emptyRes.json();
    console.log(`   Status: ${emptyRes.status}`);
    console.log(`   Response: ${JSON.stringify(emptyData)}\n`);
    
    // Test 2: Yanlış kullanıcı adı
    console.log("2️⃣ Test: Yanlış kullanıcı adı");
    const wrongUserRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wronguser", password: "admin123" }),
    });
    const wrongUserData = await wrongUserRes.json();
    console.log(`   Status: ${wrongUserRes.status}`);
    console.log(`   Response: ${JSON.stringify(wrongUserData)}\n`);
    
    // Test 3: Yanlış şifre
    console.log("3️⃣ Test: Yanlış şifre");
    const wrongPassRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrongpass" }),
    });
    const wrongPassData = await wrongPassRes.json();
    console.log(`   Status: ${wrongPassRes.status}`);
    console.log(`   Response: ${JSON.stringify(wrongPassData)}\n`);
    
    // Test 4: Doğru bilgiler
    console.log("4️⃣ Test: Doğru kullanıcı adı ve şifre");
    const correctRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const correctData = await correctRes.json();
    console.log(`   Status: ${correctRes.status}`);
    console.log(`   Response: ${JSON.stringify(correctData, null, 2)}\n`);
    
    if (correctRes.ok && correctData.token) {
      console.log("✅ Login başarılı!");
      console.log(`   Token: ${correctData.token.substring(0, 20)}...`);
      console.log(`   User: ${correctData.user.username}`);
    } else {
      console.log("❌ Login başarısız!");
      console.log(`   Hata: ${correctData.error || "Bilinmeyen hata"}`);
    }
    
  } catch (error: any) {
    console.error("❌ API testi başarısız!");
    console.error(`   Hata: ${error.message}`);
    console.error("\n🔧 Olası sorunlar:");
    console.error("   1. Server çalışıyor mu? (npm run dev)");
    console.error("   2. Port doğru mu? (PORT env variable)");
    console.error("   3. API endpoint'i erişilebilir mi?");
    console.error(`   4. Test URL: ${baseUrl}/api/admin/login`);
  }
}

testLoginAPI();

