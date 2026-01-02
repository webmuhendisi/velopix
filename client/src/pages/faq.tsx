import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData, getFAQStructuredData } from "@/lib/structuredData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useSEO({
    title: "Sıkça Sorulan Sorular",
    description: "VeloPix Computer hakkında sıkça sorulan sorular ve cevapları. Ürünler, kargo, ödeme ve daha fazlası hakkında bilgi alın.",
    keywords: "SSS, FAQ, sıkça sorulan sorular, VeloPix, yardım, destek",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "SSS", url: "/faq" },
    ]),
  });

  useEffect(() => {
    fetch("/api/faqs?active=true")
      .then((res) => res.json())
      .then((data) => {
        setFaqs(data);
        const cats = Array.from(new Set(data.map((f: FAQ) => f.category).filter(Boolean))) as string[];
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredFAQs = selectedCategory === "all"
    ? faqs
    : faqs.filter((faq) => faq.category === selectedCategory);

  const faqStructuredData = getFAQStructuredData(
    filteredFAQs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }))
  );

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(faqStructuredData);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [filteredFAQs]);

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
          <h1 className="text-4xl font-bold font-heading mb-4">Sıkça Sorulan Sorular</h1>
          <p className="text-lg text-muted-foreground">Merak ettiklerinizin cevapları burada</p>
        </motion.div>

        {categories.length > 0 && (
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === "all"
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              Tümü
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Henüz soru bulunmuyor</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq, idx) => (
                <AccordionItem key={faq.id} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

