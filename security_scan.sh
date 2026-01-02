#!/bin/bash
echo "🔥 TAM GÜVENLİK TARAMASI BAŞLATILIYOR 🔥"
echo "Hedef IP: 89.117.62.213"
echo "Tarih: $(date)"
echo "=========================================="

# Log dosyası oluştur
LOG_FILE="security_scan_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -i $LOG_FILE)
exec 2>&1

# 1. Temel bilgiler
echo "1️⃣ SİSTEM BİLGİLERİ TOPLANIYOR..."
ping -c 2 89.117.62.213
traceroute 89.117.62.213

# 2. Nmap taramaları
echo -e "\n2️⃣ NMAP TARAMALARI..."
echo "Hızlı tarama:" >> $LOG_FILE
nmap -T4 -F 89.117.62.213

echo -e "\nServis ve versiyon taraması:" >> $LOG_FILE
nmap -sV -sC 89.117.62.213

echo -e "\nGüvenlik açığı taraması:" >> $LOG_FILE
nmap --script vuln 89.117.62.213

# 3. Port kontrolü
echo -e "\n3️⃣ KRİTİK PORT KONTROLLERİ..."
PORTS="21 22 23 25 53 80 110 143 443 445 3306 3389 8080 8443"
for port in $PORTS; do
    timeout 2 nc -zv 89.117.62.213 $port 2>/dev/null && echo "✅ Port $port: AÇIK" || echo "❌ Port $port: KAPALI"
done

# 4. Web testleri
echo -e "\n4️⃣ WEB UYGULAMA TESTLERİ..."
# HTTP headers
curl -sI http://89.117.62.213 | head -20

# SSL test
echo -e "\nSSL Sertifika Bilgisi:"
timeout 5 openssl s_client -connect 89.117.62.213:443 -servername 89.117.62.213 2>/dev/null | openssl x509 -noout -dates -subject

# 5. Güvenlik açığı analizi
echo -e "\n5️⃣ GÜVENLİK AÇIĞI ANALİZİ..."
echo "Bilinen açıklar için kontrol ediliyor..."

# CVEs kontrolü (eğer searchsploit kuruluysa)
if command -v searchsploit &> /dev/null; then
    echo "Searchsploit ile açık aranıyor..."
    searchsploit --nmap nmap_full.txt 2>/dev/null || echo "Searchsploit sonuçları alınamadı"
fi

# 6. Sonuç özeti
echo -e "\n=========================================="
echo "🔍 TARAMA TAMAMLANDI"
echo "📊 SONUÇLAR $LOG_FILE dosyasına kaydedildi"
echo -e "\n⚠️  BULUNAN KRİTİK NOKTALAR:"

# Kritik port kontrolü
CRITICAL_PORTS=""
for port in 22 23 21 445 3389; do
    nc -z -w1 89.117.62.213 $port 2>/dev/null && CRITICAL_PORTS+="$port "
done

[ ! -z "$CRITICAL_PORTS" ] && echo "Kritik portlar açık: $CRITICAL_PORTS" || echo "Kritik portlar kapalı"

echo -e "\n✅ Tüm testler tamamlandı!"