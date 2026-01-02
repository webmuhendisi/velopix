import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Header from "./Header";
import MobileNav from "./MobileNav";
import CategorySidebar from "./CategorySidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      toast({
        title: "Hata",
        description: "Lütfen e-posta veya telefon numarası girin.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || null, phone: phone || null, status: "active" }),
      });

      if (!res.ok) throw new Error("Abonelik başarısız");

      toast({
        title: "Başarılı",
        description: "E-bülten aboneliğiniz oluşturuldu.",
      });
      setEmail("");
      setPhone("");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Abonelik oluşturulamadı.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="E-posta adresiniz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
      />
      <Input
        type="tel"
        placeholder="Telefon (opsiyonel)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Gönderiliyor..." : "Abone Ol"}
      </Button>
    </form>
  );
}

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isHomePage = location === "/";
  
  const [footerData, setFooterData] = useState({
    description: "En yeni teknoloji ürünleri, gaming bilgisayarlar ve profesyonel teknik servis hizmetleri.",
    newsletterTitle: "E-Bülten",
    newsletterDescription: "Yeni ürünler ve kampanyalardan haberdar olmak için e-bültenimize abone olun",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        const settingsMap: Record<string, string> = {};
        settings.forEach((setting: { key: string; value: string }) => {
          settingsMap[setting.key] = setting.value || "";
        });
        setFooterData({
          description: settingsMap.footer_description || "En yeni teknoloji ürünleri, gaming bilgisayarlar ve profesyonel teknik servis hizmetleri.",
          newsletterTitle: settingsMap.footer_newsletter_title || "E-Bülten",
          newsletterDescription: settingsMap.footer_newsletter_description || "Yeni ürünler ve kampanyalardan haberdar olmak için e-bültenimize abone olun",
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-primary/20">
      <Header />
      {isHomePage && <CategorySidebar />}
      <main className={`flex-1 w-full max-w-[100vw] overflow-x-hidden pb-20 md:pb-0 ${isHomePage ? 'lg:pl-16' : ''}`}>
        {children}
      </main>
      <MobileNav />
      
      {/* Desktop Footer */}
      <footer className="hidden md:block bg-secondary/40 py-12 border-t border-border/30 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold font-heading text-foreground mb-4">VeloPix Computer</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {footerData.description}
            </p>
          </div>
          <div>
            <h4 className="font-bold font-heading text-foreground mb-4">Kategoriler</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  Tüm Ürünler
                </Link>
              </li>
              <li>
                <Link href="/products?category=gaming" className="hover:text-primary transition-colors">
                  Gaming PC
                </Link>
              </li>
              <li>
                <Link href="/products?category=laptop" className="hover:text-primary transition-colors">
                  Laptop
                </Link>
              </li>
              <li>
                <Link href="/products?category=telefon" className="hover:text-primary transition-colors">
                  Telefon
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold font-heading text-foreground mb-4">Kurumsal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Sıkça Sorulan Sorular
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold font-heading text-foreground mb-4">İletişim</h4>
            <p className="text-sm text-muted-foreground mb-2 hover:text-primary transition-colors">0533 833 21 11</p>
            <p className="text-sm text-muted-foreground hover:text-primary transition-colors mb-4">info@velopixcomputer.com</p>
            <Link href="/orders/track" className="text-sm text-muted-foreground hover:text-primary transition-colors block mb-2">
              Sipariş Takibi
            </Link>
          </div>
        </div>
        
        {/* Newsletter Subscription */}
        <div className="container mx-auto px-4 py-8 border-t border-border/30">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-bold font-heading text-foreground mb-2">{footerData.newsletterTitle}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {footerData.newsletterDescription}
            </p>
            <NewsletterForm />
          </div>
        </div>
        
        <div className="container mx-auto px-4 pt-8 border-t border-border/30 text-center text-xs text-muted-foreground">
          &copy; 2025 VeloPix Computer. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}
