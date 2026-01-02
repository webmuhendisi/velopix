#!/bin/bash

# VeloPix Deployment Script
# Bu script projeyi zipleyip FTP'ye yükler

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# FTP Bilgileri
FTP_HOST="89.117.62.213"
FTP_USER="velopix"
FTP_PASS="LmpDsxfpcSiK6inm"
FTP_DIR="/www/wwwroot/velo.kktcportal.net"  # FTP'deki hedef dizin (yazma yetkisi olan dizin)

# Proje dizini (script'in bulunduğu dizin)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="velopix"
ZIP_NAME="${PROJECT_NAME}-$(date +%Y%m%d-%H%M%S).zip"
TEMP_DIR="/tmp/${PROJECT_NAME}-deploy"

echo -e "${GREEN}=== VeloPix Deployment Script ===${NC}"
echo ""

# 1. Geçici dizin oluştur
echo -e "${YELLOW}[1/4] Geçici dizin oluşturuluyor...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 2. Dosyaları kopyala (node_modules hariç)
echo -e "${YELLOW}[2/4] Dosyalar kopyalanıyor (node_modules hariç)...${NC}"
cd "$SCRIPT_DIR"

# rsync kullanarak node_modules hariç tüm dosyaları kopyala
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.next' \
  --exclude='.vite' \
  --exclude='coverage' \
  --exclude='.nyc_output' \
  --exclude='*.zip' \
  --exclude='deploy.sh' \
  . "$TEMP_DIR/"

if [ $? -ne 0 ]; then
  echo -e "${RED}Hata: Dosyalar kopyalanırken bir hata oluştu!${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# 3. ZIP oluştur
echo -e "${YELLOW}[3/4] ZIP dosyası oluşturuluyor...${NC}"
cd "$TEMP_DIR"
zip -r "$SCRIPT_DIR/$ZIP_NAME" . -q

if [ $? -ne 0 ]; then
  echo -e "${RED}Hata: ZIP dosyası oluşturulurken bir hata oluştu!${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Geçici dizini temizle
rm -rf "$TEMP_DIR"

ZIP_SIZE=$(du -h "$SCRIPT_DIR/$ZIP_NAME" | cut -f1)
echo -e "${GREEN}✓ ZIP dosyası oluşturuldu: $ZIP_NAME (Boyut: $ZIP_SIZE)${NC}"
echo ""

# 4. FTP'ye yükle
echo -e "${YELLOW}[4/4] FTP'ye yükleniyor...${NC}"
echo "FTP Host: $FTP_HOST"
echo "FTP User: $FTP_USER"
echo "FTP Directory: $FTP_DIR"
echo ""

# lftp kullan (daha güvenilir) veya curl (fallback)
if command -v lftp &> /dev/null; then
  echo -e "${GREEN}lftp bulundu, lftp ile yükleniyor...${NC}"
  
  # lftp ile yükle - daha güvenilir ve esnek
  # SSL sertifika doğrulamasını atla (self-signed sertifikalar için)
  # FTP protokolünü açıkça belirt (FTPS değil, normal FTP)
  LFTP_CMD="set ftp:passive-mode yes; set ftp:auto-passive-mode yes; set ssl:verify-certificate no; set ftp:ssl-allow no; open -u $FTP_USER,$FTP_PASS ftp://$FTP_HOST"
  
  # FTP kullanıcısının home dizini genellikle zaten /www/wwwroot/velo.kktcportal.net olarak ayarlanmıştır
  # Bu yüzden cd yapmadan direkt yükleyebiliriz
  # Eğer cd gerekirse, önce mevcut dizini kontrol edip sonra deneyelim
  echo -e "${YELLOW}Mevcut dizin kontrol ediliyor ve yükleme yapılıyor...${NC}"
  
  # Önce mevcut dizini göster, sonra yükle
  # FTP kullanıcısı bağlandığında zaten doğru dizinde olabilir
  LFTP_CMD="$LFTP_CMD; pwd; put $SCRIPT_DIR/$ZIP_NAME; bye"
  
  lftp -c "$LFTP_CMD"
  
  FTP_UPLOAD_RESULT=$?
else
  echo -e "${YELLOW}lftp bulunamadı, curl ile yükleniyor...${NC}"
  echo -e "${YELLOW}Not: lftp yüklemek için: brew install lftp${NC}"
  echo ""
  
  # curl ile FTP upload (fallback)
  # FTP kullanıcısının home dizini genellikle /www/wwwroot/velo.kktcportal.net olarak ayarlanmıştır
  FTP_URL="ftp://$FTP_HOST/$ZIP_NAME"
  
  # Eğer özel bir dizin kullanmak istiyorsanız, FTP_DIR'i ayarlayın
  if [ "$FTP_DIR" != "/" ] && [ -n "$FTP_DIR" ]; then
    # Dizin yolunu temizle (başında ve sonunda / olmamalı)
    FTP_DIR_CLEAN=$(echo "$FTP_DIR" | sed 's|^/||;s|/$||')
    FTP_URL="ftp://$FTP_HOST/$FTP_DIR_CLEAN/$ZIP_NAME"
  fi
  
  echo "Yükleme URL'i: $FTP_URL"
  echo ""
  
  # Pasif mod (PASV) ile yükle
  curl -T "$SCRIPT_DIR/$ZIP_NAME" \
    --user "$FTP_USER:$FTP_PASS" \
    --ftp-pasv \
    "$FTP_URL" \
    --progress-bar \
    --fail \
    --show-error
  
  FTP_UPLOAD_RESULT=$?
fi

if [ $FTP_UPLOAD_RESULT -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ Dosya başarıyla FTP'ye yüklendi!${NC}"
  echo ""
  echo -e "${GREEN}Yüklenen dosya: $ZIP_NAME${NC}"
  echo -e "${GREEN}FTP konumu: ftp://$FTP_HOST$FTP_DIR$ZIP_NAME${NC}"
  echo ""
  
  # ZIP dosyasını silmek ister misiniz?
  read -p "Yerel ZIP dosyasını silmek ister misiniz? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$SCRIPT_DIR/$ZIP_NAME"
    echo -e "${GREEN}✓ ZIP dosyası silindi.${NC}"
  else
    echo -e "${YELLOW}ZIP dosyası korundu: $ZIP_NAME${NC}"
  fi
else
  echo ""
  echo -e "${RED}✗ Hata: FTP'ye yükleme başarısız oldu!${NC}"
  echo ""
  echo "Kontrol edin:"
  echo "  - FTP bilgileri doğru mu?"
  echo "  - İnternet bağlantınız aktif mi?"
  echo "  - FTP sunucusu erişilebilir mi?"
  echo ""
  echo "ZIP dosyası korundu: $ZIP_NAME"
  exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment Tamamlandı ===${NC}"

