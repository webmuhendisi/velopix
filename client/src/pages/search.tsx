import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ui/product-card";
import { Search as SearchIcon, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLocation } from "wouter";

interface Product {
  id: string;
  title: string;
  price: string | number;
  image: string | null;
  categoryId: string;
  isNew: boolean;
  limitedStock: number | null;
  originalPrice: string | number | null;
  slug?: string | null;
}

export default function Search() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("date_desc");

  // URL'den search parametresini al
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const url = `/api/products?search=${encodeURIComponent(query)}&sortBy=${sortBy}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Arama başarısız");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [sortBy]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <form onSubmit={handleSearch} className="relative mb-6">
            <Input
              type="search"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-32 text-lg bg-secondary border-border/50"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-white"
            >
              Ara
            </Button>
          </form>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap items-center">
          <span className="text-sm font-semibold">Sırala:</span>
          <Button
            variant={sortBy === "date_desc" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSortBy("date_desc")}
          >
            Yeni Ürünler
          </Button>
          <Button
            variant={sortBy === "price_asc" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSortBy("price_asc")}
          >
            Fiyatı Düşükten Yükseğe
          </Button>
          <Button
            variant={sortBy === "price_desc" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSortBy("price_desc")}
          >
            Fiyatı Yüksekten Düşüğe
          </Button>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aranıyor...</p>
            </div>
          ) : searchQuery ? (
            <>
              <h2 className="text-lg font-bold mb-4">
                "{searchQuery}" için {results.length} sonuç bulundu
              </h2>
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Sonuç bulunamadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {results.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link href={product.slug ? `/product/${product.slug}` : `/product/${product.id}`}>
                        <ProductCard product={product} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Arama yapmak için yukarıdaki alana bir şey yazın</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
