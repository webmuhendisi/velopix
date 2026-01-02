import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/data";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRate } from "@/hooks/useExchangeRate";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { usdToTry } = useExchangeRate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast({
      title: "Sepete eklendi",
      description: `${product.title} sepete eklendi.`,
    });
  };

  // SEO: Always prefer slug over ID to avoid duplicate content
  // If slug is missing, use ID but backend will redirect to slug if available
  const productUrl = (product as any).slug 
    ? `/product/${(product as any).slug}`
    : `/product/${product.id}`;
  
  // Development warning: Products should have slugs for SEO
  if (process.env.NODE_ENV === 'development' && !(product as any).slug) {
    console.warn(`[SEO] Product "${product.title}" (${product.id}) is missing slug. Please add a slug for better SEO.`);
  }

  return (
    <Link href={productUrl}>
      <Card className="border-border/30 bg-white overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full flex flex-col cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-secondary p-4">
          {product.isNew && (
            <Badge className="absolute top-2 left-2 z-10 bg-primary hover:bg-primary/90 text-white border-none shadow-md font-bold text-[10px] px-2 py-0.5">
              YENİ
            </Badge>
          )}
          <img 
            src={product.image} 
            alt={`${product.title} - ${product.category || "Ürün"}`}
            className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <CardContent className="p-3 flex-1 flex flex-col gap-1">
          <div className="text-[10px] text-primary font-bold uppercase tracking-wider">{product.category}</div>
          <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <div className="font-bold text-lg text-foreground">
              ${typeof product.price === "string" ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ {usdToTry(product.price).toFixed(2)} ₺
            </div>
          </div>
          <Button size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors shadow-md" onClick={handleAddToCart}>
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
