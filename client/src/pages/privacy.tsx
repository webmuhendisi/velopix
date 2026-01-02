import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData } from "@/lib/structuredData";

export default function Privacy() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Gizlilik Politikası",
    description: "VeloPix Computer gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgiler.",
    keywords: "gizlilik politikası, kişisel veriler, KVKK, VeloPix, gizlilik",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "Gizlilik Politikası", url: "/privacy" },
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
        setContent(
          settingsMap.privacy_content ||
          "Gizlilik politikası içeriği buraya eklenecektir. Admin panelden düzenleyebilirsiniz."
        );
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
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold font-heading mb-8">Gizlilik Politikası</h1>
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {content}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

