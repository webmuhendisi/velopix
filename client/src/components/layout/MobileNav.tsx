import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User, Search, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Ana Sayfa", path: "/" },
    { icon: Grid, label: "Kategoriler", path: "/categories" },
    { icon: Search, label: "Ara", path: "/search" }, 
    { icon: Heart, label: "Favoriler", path: "/wishlist" },
    { icon: ShoppingCart, label: "Sepet", path: "/cart" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-border/30 z-50 pb-safe md:hidden shadow-lg">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon strokeWidth={isActive ? 2.5 : 2} size={22} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="h-safe-area-bottom w-full" />
    </div>
  );
}
