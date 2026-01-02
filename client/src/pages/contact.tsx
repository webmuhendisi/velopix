import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData } from "@/lib/structuredData";
import { useToast } from "@/hooks/use-toast";

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapEmbed: string;
}

function ContactForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      toast({
        title: "Hata",
        description: "Lütfen adınızı ve mesajınızı doldurun",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Mesaj gönderilemedi");
      }

      toast({
        title: "Başarılı",
        description: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-secondary rounded-2xl p-8"
    >
      <h3 className="text-2xl font-bold mb-6">İletişim Formu</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Adınız *</label>
          <Input
            type="text"
            placeholder="Adınızı girin"
            className="w-full"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">E-mail</label>
          <Input
            type="email"
            placeholder="E-mail adresiniz"
            className="w-full"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Telefon</label>
          <Input
            type="tel"
            placeholder="Telefon numaranız"
            className="w-full"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Konu</label>
          <Input
            type="text"
            placeholder="Mesaj konusu"
            className="w-full"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Mesaj *</label>
          <Textarea
            placeholder="Mesajınızı yazın..."
            rows={5}
            className="w-full"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold"
          disabled={loading}
        >
          {loading ? "Gönderiliyor..." : "Gönder"}
        </Button>
      </form>
    </motion.div>
  );
}

export default function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: "",
    email: "",
    address: "",
    workingHours: "",
    mapEmbed: "",
  });
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "İletişim",
    description: "VeloPix Computer iletişim bilgileri. KKTC Girne'de bize ulaşın, sorularınızı sorun ve destek alın. Telefon, e-posta ve adres bilgileri.",
    keywords: "iletişim, VeloPix, telefon, e-posta, adres, destek, KKTC, Girne, Kuzey Kıbrıs",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "İletişim", url: "/contact" },
    ]),
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        const settingsMap: Record<string, string> = {};
        settings.forEach((setting: { key: string; value: string }) => {
          settingsMap[setting.key] = setting.value || "";
        });

        setContactInfo({
          phone: settingsMap.contact_phone || "+90 533 833 21 11",
          email: settingsMap.contact_email || "info@velopixcomputer.com",
          address: settingsMap.contact_address || "Girne, Kuzey Kıbrıs Türk Cumhuriyeti",
          workingHours: settingsMap.contact_working_hours || "Pazartesi - Cuma: 09:00 - 18:00\nCumartesi - Pazar: 10:00 - 17:00",
          mapEmbed: settingsMap.contact_map_embed || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold font-heading mb-4">İletişim</h1>
          <p className="text-lg text-muted-foreground">Sorularınız ve önerileriniz için bize ulaşın</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Telefon</h3>
                <a href={`tel:${contactInfo.phone}`} className="text-muted-foreground hover:text-primary">
                  {contactInfo.phone}
                </a>
                {contactInfo.workingHours && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {contactInfo.workingHours.split("\n")[0]}
                </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">E-mail</h3>
                <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground hover:text-primary">
                  {contactInfo.email}
                </a>
                <p className="text-sm text-muted-foreground">24 saat içinde yanıt veririz</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Adres</h3>
                <p className="text-muted-foreground whitespace-pre-line">{contactInfo.address}</p>
              </div>
            </div>

            {contactInfo.workingHours && (
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Çalışma Saatleri</h3>
                  {contactInfo.workingHours.split("\n").map((line, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Form */}
          <ContactForm />
        </div>

        {/* Map */}
        {contactInfo.mapEmbed ? (
          <div className="bg-secondary rounded-2xl overflow-hidden mb-12" dangerouslySetInnerHTML={{ __html: contactInfo.mapEmbed }} />
        ) : (
          <div className="bg-secondary rounded-2xl overflow-hidden h-96 mb-12">
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Harita alanı (Google Maps entegrasyonu)</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
