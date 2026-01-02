import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Product {
  id: string;
  title: string;
  price: string | number;
  image: string | null;
  slug?: string | null;
}

export default function Wishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlistIds(ids);
    
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch products
    Promise.all(
      ids.map((id: string) =>
        fetch(`/api/products/${id}`)
          .then((res) => res.json())
          .catch(() => null)
      )
    ).then((results) => {
      setProducts(results.filter(Boolean));
      setLoading(false);
    });
  }, []);

  const removeFromWishlist = (productId: string) => {
    const updated = wishlistIds.filter((id) => id !== productId);
    setWishlistIds(updated);
    setProducts(products.filter((p) => p.id !== productId));
    localStorage.setItem("wishlist", JSON.stringify(updated));
    toast({
      title: "Kaldırıldı",
      description: "Ürün favorilerden çıkarıldı.",
    });
  };

  const handleAddToCart = (product: Product) => {
    const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: price || 0,
        image: product.image || "",
        category: "",
      },
      1
    );
    toast({
      title: "Sepete eklendi",
      description: `${product.title} sepete eklendi.`,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold font-heading mb-8">Favorilerim</h1>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Favori listeniz boş</h2>
            <p className="text-muted-foreground mb-6">
              Beğendiğiniz ürünleri favorilerinize ekleyebilirsiniz.
            </p>
            <Link href="/products">
              <Button>Ürünlere Göz At</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-border/30 bg-white overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  <Link href={product.slug ? `/product/${product.slug}` : `/product/${product.id}`}>
                    <div className="relative aspect-square overflow-hidden bg-secondary p-4 cursor-pointer">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col gap-2">
                    <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <div className="font-bold text-lg text-foreground">
                      ${typeof product.price === "string" 
                        ? parseFloat(product.price).toFixed(2) 
                        : product.price?.toFixed(2) || "0.00"}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Sepete Ekle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromWishlist(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

