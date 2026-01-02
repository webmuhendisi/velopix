import logo from "@assets/Gemini_Generated_Image_kdwvmkdwvmkdwvmk_1766829016231.png";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, User, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const [isLoggedIn] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistCount(wishlist.length);
    };
    updateWishlistCount();
    const interval = setInterval(updateWishlistCount, 1000);
    return () => clearInterval(interval);
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Top Bar - Hepsiburada Style */}
      <div className="bg-primary text-white text-xs py-2 hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:05338332111" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Phone className="w-3 h-3" />
              <span>0533 833 21 11</span>
            </a>
            <span className="text-white/80">|</span>
            <span className="text-white/80">Hızlı Teslimat & Güvenli Ödeme</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/profile" className="hover:opacity-80 transition-opacity flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Hesabım</span>
              </Link>
            ) : (
              <Link href="/login" className="hover:opacity-80 transition-opacity">
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Main Header Row */}
          <div className="h-20 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <img src={logo} alt="VeloPix" className="h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>


            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-2xl mx-4 relative">
              <Input 
                type="search" 
                placeholder="Ürün, kategori veya marka ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-gray-50 border-2 border-gray-200 focus:border-primary rounded-lg pr-12 text-sm"
              />
              <Button 
                type="submit"
                size="icon"
                className="absolute right-2 h-8 w-8 bg-primary hover:bg-primary/90 text-white rounded-md"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile Search */}
              <Link href="/search" className="md:hidden">
                <Button variant="ghost" size="icon" className="text-gray-700 hover:text-primary">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-primary hidden md:flex">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-primary">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

            </div>
          </div>

        </div>
      </header>
    </>
  );
}
