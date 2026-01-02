import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { getIconComponent } from "@/lib/icons";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  productCount?: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories/parent/null");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold font-heading mb-2">Kategoriler</h1>
          <p className="text-muted-foreground text-lg">Tüm ürün kategorilerimizi keşfet</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categories.map((cat, idx) => {
              const IconComponent = getIconComponent(cat.icon) || Package;
              return (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-12 hover:from-primary/20 hover:to-primary/10 transition-all group-hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold font-heading text-foreground mb-2">
                            {cat.name}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {cat.productCount || 0} Ürün
                          </p>
                          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">
                            Incele <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        <div className="w-24 h-24 rounded-2xl bg-white/50 flex items-center justify-center">
                          <IconComponent className="w-12 h-12 text-primary" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-secondary rounded-2xl p-6 mb-8">
          <h3 className="font-bold mb-4">Filtrele</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Fiyat Aralığı</label>
              <input type="range" className="w-full" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Marka</label>
              <select className="w-full border rounded-lg p-2">
                <option>Tümü</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
