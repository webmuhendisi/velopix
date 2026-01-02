import { Button } from "@/components/ui/button";
import { Wifi, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface InternetPackage {
  id: string;
  name: string;
  speed: number;
  price: number;
  provider: string;
  features: string[];
  highlighted?: boolean;
}

interface InternetCardProps {
  package: InternetPackage;
}

export default function InternetCard({ package: pkg }: InternetCardProps) {
  const { addInternetPackageToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addInternetPackageToCart(pkg, 1);
    toast({
      title: "Sepete eklendi",
      description: `${pkg.name} sepete eklendi.`,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative rounded-2xl p-6 md:p-8 border-2 transition-all duration-300 flex flex-col h-full ${
        pkg.highlighted
          ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 shadow-lg ring-2 ring-primary/20"
          : "bg-white border-border/30 hover:border-primary/40 hover:shadow-lg"
      }`}
    >
      {pkg.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
          Popüler
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Wifi className={`w-5 h-5 ${pkg.highlighted ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-sm font-semibold ${pkg.highlighted ? "text-primary" : "text-muted-foreground"}`}>
            {pkg.provider}
          </span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
          {pkg.speed}
          <span className="text-lg font-normal text-muted-foreground"> Mbps</span>
        </h3>
      </div>

      <div className="mb-6 flex-1">
        <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
          ${pkg.price}
          <span className="text-sm text-muted-foreground font-normal">/ay</span>
        </div>
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <div className="mb-6 space-y-2">
          {pkg.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-xs md:text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        className={`w-full rounded-full font-semibold transition-all ${
          pkg.highlighted
            ? "bg-primary hover:bg-primary/90 text-white shadow-md"
            : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/50"
        }`}
      >
        Sepete Ekle
      </Button>
    </motion.div>
  );
}
