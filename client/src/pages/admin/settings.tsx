import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, X } from "lucide-react";

interface SiteSettings {
  // About page
  aboutStory: string;
  aboutYears: string;
  aboutCustomers: string;
  aboutProducts: string;
  aboutValues: string; // JSON array of values
  aboutTeamTitle: string;
  aboutTeamDescription: string;
  aboutTeamButtonText: string;
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  // Featured banner
  featuredBannerTitle: string;
  featuredBannerDescription: string;
  featuredBannerImage: string;
  featuredBannerButtonText: string;
  featuredBannerLink: string;
  // Footer
  footerDescription: string;
  footerNewsletterTitle: string;
  footerNewsletterDescription: string;
  // Home page sections
  homeInternetTitle: string;
  homeInternetDescription: string;
  // Shipping
  freeShippingThreshold: string;
  defaultShippingCost: string;
  // Bank Account
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban: string;
  bankBranch: string;
  // Legal Pages
  termsContent: string;
  privacyContent: string;
}

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<SiteSettings>({
    aboutStory: "",
    aboutYears: "",
    aboutCustomers: "",
    aboutProducts: "",
    aboutValues: JSON.stringify([
      { icon: "Award", title: "Kalite", desc: "Sadece orijinal, kaliteli ürünler" },
      { icon: "Users", title: "Müşteri", desc: "Müşteri memnuniyeti bizim önceliği" },
      { icon: "Zap", title: "Hız", desc: "Hızlı teslimat ve servis" },
      { icon: "Heart", title: "Güven", desc: "15 yıllık tecrübe ile güvenilir partner" },
    ], null, 2),
    aboutTeamTitle: "Ekibimiz",
    aboutTeamDescription: "Deneyimli ve müşteri odaklı ekibimiz, sizin her ihtiyacınız için hazır.",
    aboutTeamButtonText: "Bize Katılın - İş İmkanları",
    aboutHeroTitle: "VeloPix Computer Hakkında",
    aboutHeroSubtitle: "2024 yılında Girne'de açılan mağazamız, 15 yıllık sektör tecrübesi ile Kuzey Kıbrıs Türk Cumhuriyeti'nin en güvenilir teknoloji mağazası olarak hizmet veriyor.",
    featuredBannerTitle: "",
    featuredBannerDescription: "",
    featuredBannerImage: "",
    featuredBannerButtonText: "",
    featuredBannerLink: "",
    footerDescription: "En yeni teknoloji ürünleri, gaming bilgisayarlar ve profesyonel teknik servis hizmetleri.",
    footerNewsletterTitle: "E-Bülten",
    footerNewsletterDescription: "Yeni ürünler ve kampanyalardan haberdar olmak için e-bültenimize abone olun",
    homeInternetTitle: "Ev İnterneti Paketleri",
    homeInternetDescription: "Hızlı, güvenilir ve uygun fiyatlı internet çözümleri. En iyi hızla en iyi fiyatta!",
    freeShippingThreshold: "",
    defaultShippingCost: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIban: "",
    bankBranch: "",
    termsContent: "",
    privacyContent: "",
  });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchData();
  }, [token, setLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const settings = await res.json();
      
      // Map settings to form data
      const settingsMap: Record<string, string> = {};
      settings.forEach((setting: { key: string; value: string }) => {
        settingsMap[setting.key] = setting.value || "";
      });

      setFormData({
        aboutStory: settingsMap.about_story || "",
        aboutYears: settingsMap.about_years || "",
        aboutCustomers: settingsMap.about_customers || "",
        aboutProducts: settingsMap.about_products || "",
        aboutValues: settingsMap.about_values || JSON.stringify([
          { icon: "Award", title: "Kalite", desc: "Sadece orijinal, kaliteli ürünler" },
          { icon: "Users", title: "Müşteri", desc: "Müşteri memnuniyeti bizim önceliği" },
          { icon: "Zap", title: "Hız", desc: "Hızlı teslimat ve servis" },
          { icon: "Heart", title: "Güven", desc: "15 yıllık tecrübe ile güvenilir partner" },
        ], null, 2),
        aboutTeamTitle: settingsMap.about_team_title || "Ekibimiz",
        aboutTeamDescription: settingsMap.about_team_description || "Deneyimli ve müşteri odaklı ekibimiz, sizin her ihtiyacınız için hazır.",
        aboutTeamButtonText: settingsMap.about_team_button_text || "Bize Katılın - İş İmkanları",
        aboutHeroTitle: settingsMap.about_hero_title || "VeloPix Computer Hakkında",
        aboutHeroSubtitle: settingsMap.about_hero_subtitle || "2024 yılında Girne'de açılan mağazamız, 15 yıllık sektör tecrübesi ile Kuzey Kıbrıs Türk Cumhuriyeti'nin en güvenilir teknoloji mağazası olarak hizmet veriyor.",
        featuredBannerTitle: settingsMap.featured_banner_title || "",
        featuredBannerDescription: settingsMap.featured_banner_description || "",
        featuredBannerImage: settingsMap.featured_banner_image || "",
        featuredBannerButtonText: settingsMap.featured_banner_button_text || "",
        featuredBannerLink: settingsMap.featured_banner_link || "",
        footerDescription: settingsMap.footer_description || "En yeni teknoloji ürünleri, gaming bilgisayarlar ve profesyonel teknik servis hizmetleri.",
        footerNewsletterTitle: settingsMap.footer_newsletter_title || "E-Bülten",
        footerNewsletterDescription: settingsMap.footer_newsletter_description || "Yeni ürünler ve kampanyalardan haberdar olmak için e-bültenimize abone olun",
        homeInternetTitle: settingsMap.home_internet_title || "Ev İnterneti Paketleri",
        homeInternetDescription: settingsMap.home_internet_description || "Hızlı, güvenilir ve uygun fiyatlı internet çözümleri. En iyi hızla en iyi fiyatta!",
        freeShippingThreshold: settingsMap.free_shipping_threshold || "",
        defaultShippingCost: settingsMap.default_shipping_cost || "",
        bankName: settingsMap.bank_name || "",
        bankAccountName: settingsMap.bank_account_name || "",
        bankAccountNumber: settingsMap.bank_account_number || "",
        bankIban: settingsMap.bank_iban || "",
        bankBranch: settingsMap.bank_branch || "",
        termsContent: settingsMap.terms_content || "",
        privacyContent: settingsMap.privacy_content || "",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const settings = [
        { key: "about_story", value: formData.aboutStory, type: "text" },
        { key: "about_years", value: formData.aboutYears, type: "text" },
        { key: "about_customers", value: formData.aboutCustomers, type: "text" },
        { key: "about_products", value: formData.aboutProducts, type: "text" },
        { key: "about_values", value: formData.aboutValues, type: "json" },
        { key: "about_team_title", value: formData.aboutTeamTitle, type: "text" },
        { key: "about_team_description", value: formData.aboutTeamDescription, type: "text" },
        { key: "about_team_button_text", value: formData.aboutTeamButtonText, type: "text" },
        { key: "about_hero_title", value: formData.aboutHeroTitle, type: "text" },
        { key: "about_hero_subtitle", value: formData.aboutHeroSubtitle, type: "text" },
        { key: "featured_banner_title", value: formData.featuredBannerTitle, type: "text" },
        { key: "featured_banner_description", value: formData.featuredBannerDescription, type: "text" },
        { key: "featured_banner_image", value: formData.featuredBannerImage, type: "text" },
        { key: "featured_banner_button_text", value: formData.featuredBannerButtonText, type: "text" },
        { key: "featured_banner_link", value: formData.featuredBannerLink, type: "text" },
        { key: "footer_description", value: formData.footerDescription, type: "text" },
        { key: "footer_newsletter_title", value: formData.footerNewsletterTitle, type: "text" },
        { key: "footer_newsletter_description", value: formData.footerNewsletterDescription, type: "text" },
        { key: "home_internet_title", value: formData.homeInternetTitle, type: "text" },
        { key: "home_internet_description", value: formData.homeInternetDescription, type: "text" },
        { key: "free_shipping_threshold", value: formData.freeShippingThreshold, type: "number" },
        { key: "default_shipping_cost", value: formData.defaultShippingCost, type: "number" },
        { key: "bank_name", value: formData.bankName, type: "text" },
        { key: "bank_account_name", value: formData.bankAccountName, type: "text" },
        { key: "bank_account_number", value: formData.bankAccountNumber, type: "text" },
        { key: "bank_iban", value: formData.bankIban, type: "text" },
        { key: "bank_branch", value: formData.bankBranch, type: "text" },
        { key: "terms_content", value: formData.termsContent, type: "text" },
        { key: "privacy_content", value: formData.privacyContent, type: "text" },
      ];

      const results = await Promise.all(
        settings.map(async (setting) => {
          const res = await fetch(`/api/admin/settings/${setting.key}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: setting.value || "", type: setting.type }),
          });
          if (!res.ok) {
            const error = await res.json();
            throw new Error(`${setting.key}: ${error.error || "Kaydedilemedi"}`);
          }
          return res.json();
        })
      );

      toast({ title: "Başarılı", description: "Site ayarları güncellendi" });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Hata",
        description: "Sadece resim dosyaları yüklenebilir",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Görsel yüklenemedi");
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, featuredBannerImage: data.url }));
      toast({
        title: "Başarılı",
        description: "Görsel yüklendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Görsel yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Site Ayarları</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Site Ayarları</h1>
          <p className="text-muted-foreground">About sayfası ve featured banner içeriklerini düzenleyin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Sayfası İçeriği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aboutStory">Hikaye Metni</Label>
                <Textarea
                  id="aboutStory"
                  value={formData.aboutStory}
                  onChange={(e) => setFormData({ ...formData, aboutStory: e.target.value })}
                  rows={6}
                  placeholder="VeloPix Computer, 2010 yılında küçük bir dükkân olarak başladı..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="aboutYears">Yıl Deneyim</Label>
                  <Input
                    id="aboutYears"
                    value={formData.aboutYears}
                    onChange={(e) => setFormData({ ...formData, aboutYears: e.target.value })}
                    placeholder="14+"
                  />
                </div>
                <div>
                  <Label htmlFor="aboutCustomers">Müşteri Sayısı</Label>
                  <Input
                    id="aboutCustomers"
                    value={formData.aboutCustomers}
                    onChange={(e) => setFormData({ ...formData, aboutCustomers: e.target.value })}
                    placeholder="50K+"
                  />
                </div>
                <div>
                  <Label htmlFor="aboutProducts">Ürün Sayısı</Label>
                  <Input
                    id="aboutProducts"
                    value={formData.aboutProducts}
                    onChange={(e) => setFormData({ ...formData, aboutProducts: e.target.value })}
                    placeholder="1000+"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="aboutHeroTitle">Hero Başlık</Label>
                <Input
                  id="aboutHeroTitle"
                  value={formData.aboutHeroTitle}
                  onChange={(e) => setFormData({ ...formData, aboutHeroTitle: e.target.value })}
                  placeholder="VeloPix Computer Hakkında"
                />
              </div>
              <div>
                <Label htmlFor="aboutHeroSubtitle">Hero Alt Başlık</Label>
                <Input
                  id="aboutHeroSubtitle"
                  value={formData.aboutHeroSubtitle}
                  onChange={(e) => setFormData({ ...formData, aboutHeroSubtitle: e.target.value })}
                  placeholder="2010 yılından beri Türkiye'nin en güvenilir teknoloji mağazası olarak hizmet veriyoruz."
                />
              </div>
              <div>
                <Label htmlFor="aboutValues">Değerlerimiz (JSON Format)</Label>
                <Textarea
                  id="aboutValues"
                  value={formData.aboutValues}
                  onChange={(e) => setFormData({ ...formData, aboutValues: e.target.value })}
                  rows={10}
                  placeholder='[{"icon": "Award", "title": "Kalite", "desc": "Sadece orijinal, kaliteli ürünler"}, ...]'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Icon seçenekleri: Award, Users, Zap, Heart, Package, Wifi, etc.
                </p>
              </div>
              <div>
                <Label htmlFor="aboutTeamTitle">Ekibimiz Başlık</Label>
                <Input
                  id="aboutTeamTitle"
                  value={formData.aboutTeamTitle}
                  onChange={(e) => setFormData({ ...formData, aboutTeamTitle: e.target.value })}
                  placeholder="Ekibimiz"
                />
              </div>
              <div>
                <Label htmlFor="aboutTeamDescription">Ekibimiz Açıklama</Label>
                <Textarea
                  id="aboutTeamDescription"
                  value={formData.aboutTeamDescription}
                  onChange={(e) => setFormData({ ...formData, aboutTeamDescription: e.target.value })}
                  rows={3}
                  placeholder="Deneyimli ve müşteri odaklı ekibimiz, sizin her ihtiyacınız için hazır."
                />
              </div>
              <div>
                <Label htmlFor="aboutTeamButtonText">Ekibimiz Buton Metni</Label>
                <Input
                  id="aboutTeamButtonText"
                  value={formData.aboutTeamButtonText}
                  onChange={(e) => setFormData({ ...formData, aboutTeamButtonText: e.target.value })}
                  placeholder="Bize Katılın - İş İmkanları"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Banner (Ana Sayfa)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="featuredBannerTitle">Başlık</Label>
                <Input
                  id="featuredBannerTitle"
                  value={formData.featuredBannerTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredBannerTitle: e.target.value })
                  }
                  placeholder="iPhone 15 Pro Max"
                />
              </div>
              <div>
                <Label htmlFor="featuredBannerDescription">Açıklama</Label>
                <Textarea
                  id="featuredBannerDescription"
                  value={formData.featuredBannerDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredBannerDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="Titanyum tasarımı ve A17 Pro çip ile şimdi stoklarda..."
                />
              </div>
              <div>
                <Label htmlFor="featuredBannerImage">Banner Görseli</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="featuredBannerImageUpload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? "Yükleniyor..." : "Görsel Yükle"}
                    </Button>
                    {formData.featuredBannerImage && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData({ ...formData, featuredBannerImage: "" })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {formData.featuredBannerImage && (
                    <div className="mt-2">
                      <img
                        src={formData.featuredBannerImage}
                        alt="Featured banner görseli"
                        className="max-w-md h-48 object-cover rounded-lg border"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.featuredBannerImage}
                      </p>
                    </div>
                  )}
                  <Input
                    id="featuredBannerImage"
                    value={formData.featuredBannerImage}
                    onChange={(e) =>
                      setFormData({ ...formData, featuredBannerImage: e.target.value })
                    }
                    placeholder="Veya görsel URL'si girin..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="featuredBannerButtonText">Buton Metni</Label>
                  <Input
                    id="featuredBannerButtonText"
                    value={formData.featuredBannerButtonText}
                    onChange={(e) =>
                      setFormData({ ...formData, featuredBannerButtonText: e.target.value })
                    }
                    placeholder="Hemen Satın Al"
                  />
                </div>
                <div>
                  <Label htmlFor="featuredBannerLink">Buton Link</Label>
                  <Input
                    id="featuredBannerLink"
                    value={formData.featuredBannerLink}
                    onChange={(e) =>
                      setFormData({ ...formData, featuredBannerLink: e.target.value })
                    }
                    placeholder="/products"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer İçeriği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footerDescription">Footer Açıklama</Label>
                <Textarea
                  id="footerDescription"
                  value={formData.footerDescription}
                  onChange={(e) => setFormData({ ...formData, footerDescription: e.target.value })}
                  rows={3}
                  placeholder="En yeni teknoloji ürünleri, gaming bilgisayarlar ve profesyonel teknik servis hizmetleri."
                />
              </div>
              <div>
                <Label htmlFor="footerNewsletterTitle">Newsletter Başlık</Label>
                <Input
                  id="footerNewsletterTitle"
                  value={formData.footerNewsletterTitle}
                  onChange={(e) => setFormData({ ...formData, footerNewsletterTitle: e.target.value })}
                  placeholder="E-Bülten"
                />
              </div>
              <div>
                <Label htmlFor="footerNewsletterDescription">Newsletter Açıklama</Label>
                <Textarea
                  id="footerNewsletterDescription"
                  value={formData.footerNewsletterDescription}
                  onChange={(e) => setFormData({ ...formData, footerNewsletterDescription: e.target.value })}
                  rows={2}
                  placeholder="Yeni ürünler ve kampanyalardan haberdar olmak için e-bültenimize abone olun"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ana Sayfa İçerikleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="homeInternetTitle">İnternet Paketleri Başlık</Label>
                <Input
                  id="homeInternetTitle"
                  value={formData.homeInternetTitle}
                  onChange={(e) => setFormData({ ...formData, homeInternetTitle: e.target.value })}
                  placeholder="Ev İnterneti Paketleri"
                />
              </div>
              <div>
                <Label htmlFor="homeInternetDescription">İnternet Paketleri Açıklama</Label>
                <Textarea
                  id="homeInternetDescription"
                  value={formData.homeInternetDescription}
                  onChange={(e) => setFormData({ ...formData, homeInternetDescription: e.target.value })}
                  rows={2}
                  placeholder="Hızlı, güvenilir ve uygun fiyatlı internet çözümleri. En iyi hızla en iyi fiyatta!"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kargo Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="freeShippingThreshold">Ücretsiz Kargo Eşiği (₺)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    step="0.01"
                    value={formData.freeShippingThreshold}
                    onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                    placeholder="500.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bu tutar ve üzeri siparişlerde kargo ücretsiz olur
                  </p>
                </div>
                <div>
                  <Label htmlFor="defaultShippingCost">Varsayılan Kargo Ücreti (₺)</Label>
                  <Input
                    id="defaultShippingCost"
                    type="number"
                    step="0.01"
                    value={formData.defaultShippingCost}
                    onChange={(e) => setFormData({ ...formData, defaultShippingCost: e.target.value })}
                    placeholder="50.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bölge tanımlı olmayan şehirler için varsayılan ücret
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banka Hesap Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Banka Adı</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Örn: Ziraat Bankası"
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccountName">Hesap Sahibi</Label>
                  <Input
                    id="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    placeholder="Örn: VeloPix Computer Ltd."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankAccountNumber">Hesap Numarası</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="bankBranch">Şube</Label>
                  <Input
                    id="bankBranch"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    placeholder="Örn: Kadıköy Şubesi"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bankIban">IBAN</Label>
                <Input
                  id="bankIban"
                  value={formData.bankIban}
                  onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yasal Sayfalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="termsContent">Kullanım Şartları İçeriği</Label>
                <Textarea
                  id="termsContent"
                  value={formData.termsContent}
                  onChange={(e) => setFormData({ ...formData, termsContent: e.target.value })}
                  rows={10}
                  placeholder="Kullanım şartları içeriği buraya yazılacak..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Önizleme: /terms
                  </a>
                </p>
              </div>
              <div>
                <Label htmlFor="privacyContent">Gizlilik Politikası İçeriği</Label>
                <Textarea
                  id="privacyContent"
                  value={formData.privacyContent}
                  onChange={(e) => setFormData({ ...formData, privacyContent: e.target.value })}
                  rows={10}
                  placeholder="Gizlilik politikası içeriği buraya yazılacak..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Önizleme: /privacy
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

