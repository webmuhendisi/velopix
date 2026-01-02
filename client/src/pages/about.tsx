import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Award, Users, Zap, Heart, Package, Wifi, TrendingUp, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData } from "@/lib/structuredData";

interface AboutData {
  story: string;
  years: string;
  customers: string;
  products: string;
  heroTitle: string;
  heroSubtitle: string;
  values: Array<{ icon: string; title: string; desc: string }>;
  teamTitle: string;
  teamDescription: string;
  teamButtonText: string;
}

export default function About() {
  const [aboutData, setAboutData] = useState<AboutData>({
    story: "",
    years: "15+",
    customers: "50K+",
    products: "1000+",
    heroTitle: "VeloPix Computer Hakkında",
    heroSubtitle: "2024 yılında Girne'de açılan mağazamız, 15 yıllık sektör tecrübesi ile Kuzey Kıbrıs Türk Cumhuriyeti'nin en güvenilir teknoloji mağazası olarak hizmet veriyor.",
    values: [
      { icon: "Award", title: "Kalite", desc: "Sadece orijinal, kaliteli ürünler" },
      { icon: "Users", title: "Müşteri", desc: "Müşteri memnuniyeti bizim önceliği" },
      { icon: "Zap", title: "Hız", desc: "Hızlı teslimat ve servis" },
      { icon: "Heart", title: "Güven", desc: "15 yıllık tecrübe ile güvenilir partner" },
    ],
    teamTitle: "Ekibimiz",
    teamDescription: "Deneyimli ve müşteri odaklı ekibimiz, sizin her ihtiyacınız için hazır.",
    teamButtonText: "Bize Katılın - İş İmkanları",
  });
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Hakkımızda",
    description: "VeloPix Computer hakkında bilgiler. 15+ yıllık sektör tecrübesi, 50K+ mutlu müşteri ve 1000+ ürün çeşidi ile KKTC Girne'de teknoloji dünyasında güvenilir çözüm ortağınız.",
    keywords: "VeloPix, hakkımızda, şirket, teknoloji, elektronik, KKTC, Girne, Kuzey Kıbrıs",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "Hakkımızda", url: "/about" },
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

        // Parse values JSON
        let values = [
          { icon: "Award", title: "Kalite", desc: "Sadece orijinal, kaliteli ürünler" },
          { icon: "Users", title: "Müşteri", desc: "Müşteri memnuniyeti bizim önceliği" },
          { icon: "Zap", title: "Hız", desc: "Hızlı teslimat ve servis" },
          { icon: "Heart", title: "Güven", desc: "15 yıllık tecrübe ile güvenilir partner" },
        ];
        try {
          if (settingsMap.about_values) {
            const parsed = JSON.parse(settingsMap.about_values);
            if (Array.isArray(parsed)) {
              values = parsed;
            }
          }
        } catch (e) {
          console.error("Failed to parse about_values:", e);
        }

        setAboutData({
          story: settingsMap.about_story || "VeloPix Computer, 2024 yılında Kuzey Kıbrıs Türk Cumhuriyeti'nin Girne bölgesinde açıldı. 15 yıllık sektör tecrübemiz ve müşteri memnuniyetine verdiğimiz önem sayesinde, KKTC'nin en güvenilir teknoloji mağazalarından biri olarak hizmet veriyoruz.",
          years: settingsMap.about_years || "15+",
          customers: settingsMap.about_customers || "50K+",
          products: settingsMap.about_products || "1000+",
          heroTitle: settingsMap.about_hero_title || "VeloPix Computer Hakkında",
          heroSubtitle: settingsMap.about_hero_subtitle || "2024 yılında Girne'de açılan mağazamız, 15 yıllık sektör tecrübesi ile Kuzey Kıbrıs Türk Cumhuriyeti'nin en güvenilir teknoloji mağazası olarak hizmet veriyor.",
          values,
          teamTitle: settingsMap.about_team_title || "Ekibimiz",
          teamDescription: settingsMap.about_team_description || "Deneyimli ve müşteri odaklı ekibimiz, sizin her ihtiyacınız için hazır.",
          teamButtonText: settingsMap.about_team_button_text || "Bize Katılın - İş İmkanları",
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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold font-heading mb-4">{aboutData.heroTitle}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {aboutData.heroSubtitle}
          </p>
        </motion.div>

        {/* Story */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-3xl font-bold font-heading mb-4">Hikayemiz</h2>
            {aboutData.story && (
              <div className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">
                {aboutData.story}
              </div>
            )}
            <Link href="/contact">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full font-bold">
                Bize Ulaşın
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12"
          >
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{aboutData.years}</p>
                <p className="text-muted-foreground">Yıl Deneyim</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{aboutData.customers}</p>
                <p className="text-muted-foreground">Mutlu Müşteri</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{aboutData.products}</p>
                <p className="text-muted-foreground">Ürün Çeşidi</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">Değerlerimiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {aboutData.values.map((value, idx) => {
              const iconMap: Record<string, any> = {
                Award,
                Users,
                Zap,
                Heart,
                Package,
                Wifi,
                TrendingUp,
                Wrench,
              };
              const IconComponent = iconMap[value.icon] || Award;
              return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-secondary rounded-xl p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </motion.div>
            );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-heading mb-6">{aboutData.teamTitle}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            {aboutData.teamDescription}
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full font-bold">
            {aboutData.teamButtonText}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
