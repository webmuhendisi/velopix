import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData } from "@/lib/structuredData";

export default function Terms() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Kullanım Şartları",
    description: "VeloPix Computer kullanım şartları ve koşulları. Sitemizi kullanırken uymanız gereken kurallar ve yasal bilgiler.",
    keywords: "kullanım şartları, şartlar ve koşullar, VeloPix, yasal",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "Kullanım Şartları", url: "/terms" },
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
          settingsMap.terms_content ||
          "Kullanım şartları içeriği buraya eklenecektir. Admin panelden düzenleyebilirsiniz."
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
          <h1 className="text-4xl font-bold font-heading mb-8">Kullanım Şartları</h1>
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

