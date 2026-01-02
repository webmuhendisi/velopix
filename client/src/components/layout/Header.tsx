import logo from "@assets/Gemini_Generated_Image_kdwvmkdwvmkdwvmk_1766829016231.png";
import { Link } from "wouter";
import { Search, ShoppingCart, User, Phone, Wrench, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const [isLoggedIn] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();

  useEffect(() => {
    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistCount(wishlist.length);
    };
    updateWishlistCount();
    const interval = setInterval(updateWishlistCount, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-border/30 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile: Logo Left, Actions Right */}
        <div className="flex items-center gap-2 md:hidden">
           <Link href="/" className="flex items-center">
              <img src={logo} alt="VeloPix" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* Desktop: Logo + Nav */}
        <div className="hidden md:flex items-center gap-12">
          <Link href="/" className="flex items-center">
              <img src={logo} alt="VeloPix" className="h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Ana Sayfa</Link>
            <Link href="/products" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Ürünler</Link>
            <Link href="/repair" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1">
              <Wrench className="w-4 h-4" />
              Tamir
            </Link>
            <Link href="/blog" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Blog</Link>
            <Link href="/about" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Hakkımızda</Link>
            <Link href="/contact" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">İletişim</Link>
          </nav>
        </div>

        {/* Desktop: Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Input 
            type="search" 
            placeholder="Ürün ara..." 
            className="w-full bg-secondary border-border/50 focus:border-primary/50 transition-all pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="md:hidden">
             <Link href="/search">
               <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                <Search className="w-5 h-5" />
              </Button>
             </Link>
          </div>

          <a href="tel:05338332111" className="hidden md:flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            <span>0533 833 21 11</span>
          </a>

          <div className="h-6 w-px bg-border hidden md:block" />

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Button>
          </Link>

          {isLoggedIn ? (
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="hidden md:flex text-foreground hover:text-primary transition-colors">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-full font-bold">
                Giriş Yap
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
