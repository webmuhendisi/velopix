import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, Check, AlertCircle, Package, Search } from "lucide-react";
import { motion } from "framer-motion";

interface RepairService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

const iconMap: Record<string, any> = {
  Wrench,
  Package,
  Clock,
  Check,
  AlertCircle,
};

export default function Repair() {
  const [services, setServices] = useState<RepairService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/repair-services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
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
          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-12 mb-12 text-center border-2 border-red-200"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-red-600 mb-4">
            Tamir & Bakım Hizmetleri
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-6">
            Tüm elektronik aletleriniz için profesyonel tamir ve bakım hizmetleri. Hızlı, güvenilir ve uygun fiyatlı çözümler.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/repair/new">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold px-8">
                Tamir Talebi Oluştur
              </Button>
            </Link>
            <Link href="/repair/track">
              <Button size="lg" variant="outline" className="rounded-full font-bold px-8">
                <Search className="w-4 h-4 mr-2" />
                Tamir Takip
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold font-heading mb-8">Tamir Hizmetlerimiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const IconComponent = service.icon ? iconMap[service.icon] || Wrench : Wrench;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white border-2 border-red-200 rounded-2xl p-8 hover:border-red-400 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center mb-4 transition-colors">
                    <IconComponent className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-muted-foreground mb-6">{service.description}</p>
                  )}
                  <Link href={`/repair/new?service=${service.id}`}>
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full">
                      Tamir İsteği
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Process */}
        <div className="bg-secondary rounded-2xl p-12 mb-12">
          <h2 className="text-3xl font-bold font-heading mb-8 text-center">Tamir Süreci</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: AlertCircle, title: "Tanı", desc: "Cihazınızı inceleyelim" },
              { icon: Clock, title: "Zamanlama", desc: "Tamir tarihini belirleyin" },
              { icon: Wrench, title: "Tamir", desc: "Profesyonel tamir işlemi" },
              { icon: Check, title: "Teslim", desc: "Kaliteli ürünü alın" },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-bold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold font-heading mb-8">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            {[
              { q: "Tamir ne kadar sürer?", a: "Çoğu tamir işlemi 1-3 gün içinde tamamlanır." },
              { q: "Garantisi var mı?", a: "Evet, tüm tamirler 6 ay garantili." },
              { q: "Nasıl başvuru yapabilirim?", a: "Telefonla veya web üzerinden tamir talebi oluşturabilirsiniz." },
            ].map((faq, idx) => (
              <div key={idx} className="bg-secondary rounded-lg p-4">
                <h4 className="font-bold mb-2">{faq.q}</h4>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
