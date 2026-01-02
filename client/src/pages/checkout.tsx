import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Lock, MapPin, Navigation, Edit3, Map, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRate } from "@/hooks/useExchangeRate";

// WhatsApp numarası - .env dosyasından alınır (VITE_WHATSAPP_NUMBER)
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "905338332111";

interface AddressForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

type AddressMode = "manual" | "location";

export default function Checkout() {
  const { items, getTotalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { usdToTry } = useExchangeRate();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [addressMode, setAddressMode] = useState<AddressMode>("manual");
  const [formData, setFormData] = useState<AddressForm>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [bankInfo, setBankInfo] = useState<any>(null);
  // Ödeme yöntemi artık sadece bank transfer
  const [loadingSettings, setLoadingSettings] = useState(true);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
  const total = subtotal + shipping;

  useEffect(() => {
    if (items.length === 0) {
      setLocation("/cart");
    }
    fetchSettings();
  }, [items, setLocation]);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const settingsRes = await fetch("/api/settings");
      const settings = await settingsRes.json();
      const settingsMap: Record<string, string> = {};
      settings.forEach((s: { key: string; value: string }) => {
        settingsMap[s.key] = s.value || "";
      });

      setBankInfo({
        bankName: settingsMap.bank_name || "",
        bankAccountName: settingsMap.bank_account_name || "",
        bankAccountNumber: settingsMap.bank_account_number || "",
        bankIban: settingsMap.bank_iban || "",
        bankBranch: settingsMap.bank_branch || "",
      });

      const threshold = parseFloat(settingsMap.free_shipping_threshold || "0");
      setFreeShippingThreshold(threshold);

      // Shipping cost'u useEffect'te yönetiyoruz, burada sadece default değer kullan
      // useEffect zaten formData.city değiştiğinde çağrılacak
    } catch (error) {
      console.error("Settings yüklenemedi:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Şehir değiştiğinde kargo ücretini güncelle (debounce ile)
  useEffect(() => {
    if (!formData.city) {
      setShippingCost(0);
      return;
    }

    // Debounce: 500ms bekle
    const timeoutId = setTimeout(() => {
      fetch(`/api/shipping-cost?city=${encodeURIComponent(formData.city)}&subtotal=${subtotal}`)
        .then((res) => {
          if (!res.ok) {
            // 429 veya diğer hatalar için default değer kullan
            if (res.status === 429) {
              console.warn("Kargo ücreti API'si rate limit'e takıldı, varsayılan değer kullanılıyor");
              return { cost: 0 };
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data && typeof data.cost === 'number') {
            setShippingCost(data.cost);
          } else {
            setShippingCost(0);
          }
        })
        .catch((error) => {
          console.error("Kargo ücreti hesaplanamadı:", error);
          setShippingCost(0);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.city, subtotal]);

  const handleInputChange = (field: keyof AddressForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Konum desteklenmiyor",
        description: "Tarayıcınız konum servisini desteklemiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        // Reverse geocoding ile adres bilgilerini al
        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
        )
          .then((res) => res.json())
          .then((data) => {
            setFormData((prev) => ({
              ...prev,
              address: data.locality || data.principalSubdivision || prev.address,
              city: data.city || data.locality || prev.city,
              district: data.principalSubdivision || prev.district,
            }));
            setIsLoadingLocation(false);
            setAddressMode("location");
            toast({
              title: "Konum alındı",
              description: "Konumunuz başarıyla alındı ve haritada gösteriliyor.",
            });
          })
          .catch(() => {
            setIsLoadingLocation(false);
            setAddressMode("location");
            toast({
              title: "Konum alındı",
              description: "Konumunuz alındı, haritada gösteriliyor.",
            });
          });
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({
          title: "Konum alınamadı",
          description: error.message || "Lütfen adres bilgilerini manuel girin.",
          variant: "destructive",
        });
      }
    );
  };

  const switchToManualMode = () => {
    setAddressMode("manual");
    setFormData((prev) => ({
      ...prev,
      latitude: undefined,
      longitude: undefined,
    }));
  };

  const generateWhatsAppMessage = (): string => {
    let message = "🛒 *YENİ SİPARİŞ*\n\n";
    message += "📋 *Sipariş Detayları:*\n\n";

    let itemIndex = 1;
    items.forEach((item) => {
      if (item.type === "product" && item.product) {
        message += `${itemIndex}. ${item.product.title}\n`;
        message += `   Adet: ${item.quantity}\n`;
        const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        message += `   Fiyat: $${price.toFixed(2)}\n`;
        message += `   Toplam: $${(price * item.quantity).toFixed(2)}\n\n`;
        itemIndex++;
      } else if (item.type === "internet" && item.internetPackage) {
        const price = typeof item.internetPackage.price === 'string' ? parseFloat(item.internetPackage.price) : item.internetPackage.price;
        message += `${itemIndex}. 📶 ${item.internetPackage.name} (${item.internetPackage.provider} - ${item.internetPackage.speed} Mbps)\n`;
        message += `   Adet: ${item.quantity}\n`;
        message += `   Fiyat: $${price.toFixed(2)}/ay\n`;
        message += `   Toplam: $${(price * item.quantity).toFixed(2)}/ay\n\n`;
        itemIndex++;
      }
    });

    message += `💰 *Ara Toplam:* $${subtotal.toFixed(2)}\n`;
    message += `🚚 *Kargo:* ${shipping === 0 ? "Ücretsiz" : `$${shipping.toFixed(2)}`}\n`;
    message += `💵 *Toplam:* $${total.toFixed(2)}\n\n`;

    message += "👤 *Müşteri Bilgileri:*\n\n";
    message += `İsim: ${formData.fullName}\n`;
    message += `Telefon: ${formData.phone}\n\n`;

    message += "📍 *Teslimat Adresi:*\n\n";
    message += `${formData.address}\n`;
    if (formData.district) message += `${formData.district}, `;
    if (formData.city) message += `${formData.city}\n`;
    if (formData.postalCode) message += `Posta Kodu: ${formData.postalCode}\n`;

    if (formData.latitude && formData.longitude) {
      message += `\n🗺️ Konum: https://www.google.com/maps?q=${formData.latitude},${formData.longitude}\n`;
    }

    if (formData.notes) {
      message += `\n📝 Notlar: ${formData.notes}\n`;
    }

    return encodeURIComponent(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validasyonu
    if (!formData.fullName || !formData.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen ad soyad ve telefon bilgilerini girin.",
        variant: "destructive",
      });
      return;
    }

    // Adres moduna göre validasyon
    if (addressMode === "manual" && (!formData.address || !formData.city)) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen adres bilgilerini girin.",
        variant: "destructive",
      });
      return;
    }

    if (addressMode === "location" && (!formData.latitude || !formData.longitude)) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen konumunuzu alın.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Siparişi veritabanına kaydet
      const orderData = {
        customerName: formData.fullName,
        customerPhone: formData.phone,
        address: formData.address,
        city: formData.city || null,
        district: formData.district || null,
        postalCode: formData.postalCode || null,
        latitude: formData.latitude ? formData.latitude.toString() : null,
        longitude: formData.longitude ? formData.longitude.toString() : null,
        notes: formData.notes || null,
        total: total.toFixed(2),
        shippingCost: shipping.toFixed(2),
        paymentMethod: "bank",
        status: "pending",
      };

      const orderItems = items
        .filter(item => item.type === "product" && item.product)
        .map(item => ({
          productId: item.product!.id,
          quantity: item.quantity,
          price: typeof item.product!.price === 'number' ? item.product!.price.toFixed(2) : item.product!.price,
        }));

      const internetPackages = items
        .filter(item => item.type === "internet" && item.internetPackage)
        .map(item => {
          const price = typeof item.internetPackage!.price === 'string' 
            ? parseFloat(item.internetPackage!.price) 
            : item.internetPackage!.price;
          return {
            internetPackageId: item.internetPackage!.id,
            quantity: item.quantity,
            price: price.toFixed(2),
          };
        });

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          order: orderData, 
          items: orderItems,
          internetPackages: internetPackages 
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Sipariş kaydedilemedi");
      }

      const savedOrder = await orderResponse.json();
      const orderNumber = savedOrder.orderNumber || savedOrder.id;

      // WhatsApp mesajına sipariş numarası ekle
      let message = generateWhatsAppMessage();
      message += `\n\n📦 *Sipariş Numarası: ${orderNumber}*`;
      
      message += `\n\n💳 *Ödeme Yöntemi: Havale/EFT*\n💰 Ödeme yapıldıktan sonra siparişiniz hazırlanacaktır.`;
      
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

      // WhatsApp'ı yeni sekmede aç
      window.open(whatsappUrl, "_blank");

      // Sepeti temizle
      clearCart();

      toast({
        title: "Sipariş oluşturuldu",
        description: `Sipariş numaranız: ${orderNumber}. WhatsApp üzerinden siparişiniz gönderildi.`,
      });

      // Ana sayfaya yönlendir
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold font-heading mb-8">Sipariş Özeti</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-bold mb-4">Sipariş Detayları</h2>
              <div className="space-y-4">
                {items.map((item) => {
                  if (item.type === "product" && item.product) {
                    const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
                    return (
                      <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.image || "/placeholder.png"}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{item.product.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Adet: {item.quantity} × ${price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className="flex flex-col mt-1">
                            <p className="text-primary font-bold">
                              ${(price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ≈ {usdToTry(price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.type === "internet" && item.internetPackage) {
                    const price = typeof item.internetPackage.price === 'string' ? parseFloat(item.internetPackage.price) : item.internetPackage.price;
                    return (
                      <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-secondary">
                          <Wifi className="w-10 h-10 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{item.internetPackage.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.internetPackage.provider} - {item.internetPackage.speed} Mbps
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Adet: {item.quantity} × ${price.toFixed(2)}/ay
                          </p>
                          <p className="text-primary font-bold mt-1">
                            ${(price * item.quantity).toFixed(2)}/ay
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </motion.div>

            {/* Address Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="bg-secondary rounded-2xl p-6 space-y-6"
            >
              <h2 className="text-xl font-bold mb-4">Teslimat Bilgileri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Ad Soyad *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Adres Modu Seçimi */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={addressMode === "manual" ? "default" : "outline"}
                    onClick={() => setAddressMode("manual")}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Adres Yaz
                  </Button>
                  <Button
                    type="button"
                    variant={addressMode === "location" ? "default" : "outline"}
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {isLoadingLocation ? "Konum Alınıyor..." : "Konumumu Al"}
                  </Button>
                </div>

                {/* Manuel Adres Girişi */}
                {addressMode === "manual" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <Label htmlFor="address">Adres *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        required
                        placeholder="Mahalle, Sokak, Bina No, Daire No"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="district">İlçe</Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) => handleInputChange("district", e.target.value)}
                          placeholder="İlçe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Şehir *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          required
                          placeholder="Şehir"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Posta Kodu</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange("postalCode", e.target.value)}
                          placeholder="34000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Konum Modu - Google Maps */}
                {addressMode === "location" && formData.latitude && formData.longitude && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Konumunuz başarıyla alındı</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={switchToManualMode}
                        className="text-green-700 hover:text-green-800"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Adres Yaz
                      </Button>
                    </div>

                    {/* Google Maps - OpenStreetMap Embed (API key gerektirmez) */}
                    <div className="rounded-lg overflow-hidden border border-border bg-muted">
                      <iframe
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.01},${formData.latitude - 0.01},${formData.longitude + 0.01},${formData.latitude + 0.01}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                      />
                      <div className="bg-muted/50 p-2 text-center border-t border-border">
                        <a
                          href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                        >
                          <Map className="w-4 h-4" />
                          Google Maps'te Aç
                        </a>
                      </div>
                    </div>

                    {/* Otomatik doldurulan adres bilgileri (opsiyonel düzenleme için) */}
                    {(formData.address || formData.city || formData.district) && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Otomatik Doldurulan Adres Bilgileri</Label>
                        <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                          {formData.address && <p><strong>Adres:</strong> {formData.address}</p>}
                          {formData.district && <p><strong>İlçe:</strong> {formData.district}</p>}
                          {formData.city && <p><strong>Şehir:</strong> {formData.city}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Bu bilgileri düzenlemek için "Adres Yaz" seçeneğine geçebilirsiniz.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Konum alınmaya çalışılıyor */}
                {addressMode === "location" && !formData.latitude && !formData.longitude && isLoadingLocation && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Konumunuz alınıyor...</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Kapı zili, kat bilgisi vb."
                  rows={3}
                />
              </div>
            </motion.form>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-secondary rounded-2xl p-6 h-fit sticky top-20"
          >
            <h2 className="text-xl font-bold mb-4">Sipariş Özeti</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-border">
              <div className="flex justify-between text-sm">
                <span>Ara Toplam</span>
                <div className="flex flex-col items-end">
                  <span>${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs text-muted-foreground">≈ {usdToTry(subtotal).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Kargo
                </span>
                <span>{shipping === 0 ? "Ücretsiz" : `$${shipping.toFixed(2)}`}</span>
              </div>
            </div>

            <div className="flex justify-between mb-6 font-bold text-lg">
              <span>Toplam</span>
              <div className="flex flex-col items-end">
                <span className="text-primary">${total.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-sm text-muted-foreground font-normal">≈ {usdToTry(total).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
              </div>
            </div>

            {/* Banka Hesap Bilgileri */}
            {bankInfo && bankInfo.bankName && (
              <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-6 space-y-3">
                <h3 className="font-bold text-xl text-blue-900 mb-3">Banka Hesap Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <p><strong className="text-blue-900">Banka:</strong> <span className="text-blue-800">{bankInfo.bankName}</span></p>
                  <p><strong className="text-blue-900">Hesap Sahibi:</strong> <span className="text-blue-800">{bankInfo.bankAccountName}</span></p>
                  {bankInfo.bankAccountNumber && (
                    <p><strong className="text-blue-900">Hesap No:</strong> <span className="text-blue-800 font-mono">{bankInfo.bankAccountNumber}</span></p>
                  )}
                  {bankInfo.bankIban && (
                    <p><strong className="text-blue-900">IBAN:</strong> <span className="text-blue-800 font-mono">{bankInfo.bankIban}</span></p>
                  )}
                  {bankInfo.bankBranch && (
                    <p><strong className="text-blue-900">Şube:</strong> <span className="text-blue-800">{bankInfo.bankBranch}</span></p>
                  )}
                </div>
                <p className="text-sm text-blue-700 mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  💳 Ödemenizi yaptıktan sonra WhatsApp ile siparişinizi gönderin.
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full font-bold mb-3"
            >
              WhatsApp ile Sipariş Ver
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-4 h-4" />
              Güvenli ödeme
            </div>

            <Link href="/cart">
              <Button variant="outline" className="w-full mt-4 rounded-full">
                Sepete Dön
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

