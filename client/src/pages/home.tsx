import { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { useSEO } from "@/hooks/useSEO";
import { getOrganizationStructuredData, getWebsiteStructuredData } from "@/lib/structuredData";
import ProductCard from "@/components/ui/product-card";
import InternetCard from "@/components/ui/internet-card";
import CountdownTimer from "@/components/ui/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Zap, Sparkles, RotateCcw, Wifi, TrendingUp, Wrench, Package } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { getIconComponent } from "@/lib/icons";

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string | null;
  link: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  productCount?: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  image: string | null;
  categoryId: string;
  isNew: boolean;
  limitedStock: number | null;
  slug?: string | null;
}

interface InternetPackage {
  id: string;
  name: string;
  speed: number;
  price: number;
  provider: string;
  features: string | null;
  highlighted: boolean;
}

interface RepairService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface FeaturedBanner {
  title: string;
  description: string;
  image: string;
  buttonText: string;
  link: string;
}


export default function Home() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const [slides, setSlides] = useState<Slide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [internetPackages, setInternetPackages] = useState<InternetPackage[]>([]);
  const [repairServices, setRepairServices] = useState<RepairService[]>([]);
  const [featuredBanner, setFeaturedBanner] = useState<FeaturedBanner | null>(null);
  const [homeInternetTitle, setHomeInternetTitle] = useState("Ev İnterneti Paketleri");
  const [homeInternetDescription, setHomeInternetDescription] = useState("Hızlı, güvenilir ve uygun fiyatlı internet çözümleri. En iyi hızla en iyi fiyatta!");
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Ana Sayfa",
    description: "KKTC Girne'de gaming bilgisayar, laptop, telefon ve teknoloji ürünlerinde en iyi fiyatlar. Hızlı teslimat ve güvenli ödeme seçenekleri. 15 yıllık tecrübe ile hizmetinizdeyiz.",
    keywords: "gaming bilgisayar, laptop, telefon, teknoloji, elektronik, bilgisayar, oyun bilgisayarı, KKTC, Girne, Kuzey Kıbrıs",
    structuredData: [
      getOrganizationStructuredData(),
      getWebsiteStructuredData(),
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slidesRes, categoriesRes, productsRes, packagesRes, servicesRes, settingsRes] = await Promise.all([
        fetch("/api/slides"),
        fetch("/api/categories/parent/null"), // Sadece ana kategorileri getir
        fetch("/api/products"),
        fetch("/api/internet-packages"),
        fetch("/api/repair-services"),
        fetch("/api/settings"),
      ]);

      const slidesData = await slidesRes.json();
      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();
      const packagesData = await packagesRes.json();
      const servicesData = await servicesRes.json();
      const settingsData = await settingsRes.json();

      setSlides(slidesData);
      // Sadece ana kategorileri göster (parentId: null olanlar)
      const mainCategories = Array.isArray(categoriesData) 
        ? categoriesData.filter((cat: Category) => !cat.parentId)
        : [];
      setCategories(mainCategories);
      setProducts(productsData);
      setInternetPackages(packagesData);
      setRepairServices(servicesData);

      // Parse settings for featured banner
      const settingsMap: Record<string, string> = {};
      settingsData.forEach((setting: { key: string; value: string }) => {
        settingsMap[setting.key] = setting.value || "";
      });

      if (settingsMap.featured_banner_title) {
        setFeaturedBanner({
          title: settingsMap.featured_banner_title,
          description: settingsMap.featured_banner_description || "",
          image: settingsMap.featured_banner_image || "",
          buttonText: settingsMap.featured_banner_button_text || "Hemen Satın Al",
          link: settingsMap.featured_banner_link || "#",
        });
      }

      // Set home page content
      setHomeInternetTitle(settingsMap.home_internet_title || "Ev İnterneti Paketleri");
      setHomeInternetDescription(settingsMap.home_internet_description || "Hızlı, güvenilir ve uygun fiyatlı internet çözümleri. En iyi hızla en iyi fiyatta!");
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get active campaign products
  const [campaignProducts, setCampaignProducts] = useState<Product[]>([]);
  const [campaignTitle, setCampaignTitle] = useState("Haftanın Ürünleri");
  const [campaignEndDate, setCampaignEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch("/api/campaigns/active?type=weekly");
        if (res.ok) {
          const campaign = await res.json();
          if (campaign && campaign.products) {
            setCampaignTitle(campaign.title || "Haftanın Ürünleri");
            setCampaignEndDate(new Date(campaign.endDate));
            // Map campaign products to Product format
            const mappedProducts = campaign.products
              .filter((cp: any) => cp.product)
              .map((cp: any) => ({
                id: cp.product.id,
                title: cp.product.title,
                price: cp.specialPrice ? parseFloat(cp.specialPrice) : parseFloat(cp.product.price),
                originalPrice: cp.specialPrice ? parseFloat(cp.product.price) : null,
                image: cp.product.image,
                categoryId: cp.product.categoryId,
                isNew: true,
                limitedStock: cp.product.limitedStock,
                slug: cp.product.slug || null,
              }));
            setCampaignProducts(mappedProducts);
            return;
          }
        }
        // Fallback to isNew products if no campaign
        const weeklyProducts = products.filter((p) => p.isNew).slice(0, 5);
        setCampaignProducts(weeklyProducts);
      } catch (error) {
        console.error("Failed to fetch campaign:", error);
        // Fallback to isNew products
        const weeklyProducts = products.filter((p) => p.isNew).slice(0, 5);
        setCampaignProducts(weeklyProducts);
      }
    };
    fetchCampaign();
  }, [products]);

  // Get weekly products (fallback - will be replaced by campaign products)
  const weeklyProducts = campaignProducts.length > 0 ? campaignProducts : products.filter((p) => p.isNew).slice(0, 5);

  // Get featured products (first 5)
  const featuredProducts = products.slice(0, 5);

  // Get second-hand products (filter by category slug if available)
  const secondhandCategory = categories.find((c) => c.slug === "secondhand");
  const secondhandProducts = secondhandCategory
    ? products.filter((p) => p.categoryId === secondhandCategory.id)
    : [];

  // Get more products (slice 5-10)
  const moreProducts = products.slice(5, 10);

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
      {/* Hero Slider - Hepsiburada Style */}
      <section className="relative w-full overflow-hidden bg-white">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="m-0">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="p-0">
                <div className="relative w-full aspect-[16/6] md:aspect-[21/6] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={`${slide.title} - ${slide.subtitle || "Slider görseli"}`}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay - minimal */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex items-center justify-start">
                    <motion.div 
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="container mx-auto px-6 md:px-12 max-w-2xl"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="text-white/90 text-sm md:text-lg mb-6 drop-shadow-md max-w-xl">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.link ? (
                          <Link href={slide.link}>
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-lg px-8 py-6 font-bold shadow-lg text-base">
                              Hemen Keşfet
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/products">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-lg px-8 py-6 font-bold shadow-lg text-base">
                              Hemen Keşfet
                            </Button>
                          </Link>
                        )}
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      {/* Categories - Hepsiburada Style */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Kategoriler</h2>
            <Link href="/categories" className="text-sm text-primary hover:underline font-semibold">
              Tümünü Gör
            </Link>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.map((cat) => {
              const IconComponent = getIconComponent(cat.icon) || Package;
              return (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <motion.div 
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-3 cursor-pointer group p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-white group-hover:from-primary/20 group-hover:via-primary/10 group-hover:to-primary/5 flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
                      <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                        {cat.name}
                      </span>
                      {cat.productCount !== undefined && (
                        <span className="text-[10px] text-gray-500 mt-1">
                          {cat.productCount} ürün
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Repair Services Section - Highlighted */}
      <section className="py-12 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-y-2 border-red-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold font-heading flex items-center justify-center gap-2 mb-2">
              <Wrench className="w-8 h-8 text-red-600" />
              Tamir & Bakım Hizmetleri
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Tüm elektronik aletleriniz için profesyonel tamir ve bakım hizmetleri
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {repairServices.map((service) => {
              const IconComponent = getIconComponent(service.icon) || Wrench;
              return (
                <Link key={service.id} href={`/repair/new?service=${service.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl p-4 md:p-6 text-center border-2 border-red-200 hover:border-red-400 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center mx-auto mb-3 transition-colors">
                      <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-red-600" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm md:text-base group-hover:text-red-600 transition-colors">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/repair">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg px-8">
                Tamir Talebi Oluştur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Weekly Specials - Countdown */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {campaignTitle}
            </h2>
            {campaignEndDate && <CountdownTimer targetDate={campaignEndDate} />}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {weeklyProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                className="relative"
              >
                <ProductCard product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  category: "",
                  image: product.image || "",
                  isNew: product.isNew,
                  originalPrice: product.originalPrice || undefined,
                  limitedStock: product.limitedStock || undefined,
                  slug: product.slug || undefined,
                }} />
                {product.limitedStock && (
                  <div className="absolute top-2 right-2 z-20 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">
                    Kalan: {product.limitedStock}
                  </div>
                )}
                {product.originalPrice && (
                  <div className="absolute top-2 left-2 z-20 bg-primary text-white px-2 py-1 rounded-lg text-[10px] font-bold">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary fill-primary" />
              Fırsat Ürünleri
            </h2>
            <Link href="/products" className="text-sm font-semibold text-primary flex items-center hover:gap-2 transition-all">
              Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={{
                id: product.id,
                title: product.title,
                price: product.price,
                category: "",
                image: product.image || "",
                isNew: product.isNew,
                originalPrice: product.originalPrice || undefined,
                limitedStock: product.limitedStock || undefined,
                slug: product.slug || undefined,
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* Second-hand Products Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              2. El Ürünler
            </h2>
            <Link href="/products" className="text-sm font-semibold text-primary flex items-center hover:gap-2 transition-all">
              Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {secondhandProducts.map((product) => (
              <ProductCard key={product.id} product={{
                id: product.id,
                title: product.title,
                price: product.price,
                category: "",
                image: product.image || "",
                isNew: product.isNew,
                originalPrice: product.originalPrice || undefined,
                limitedStock: product.limitedStock || undefined,
                slug: product.slug || undefined,
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* Home Internet Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading flex items-center justify-center gap-2 mb-2">
              <Wifi className="w-8 h-8 text-primary" />
              {homeInternetTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {homeInternetDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {internetPackages.map((pkg) => {
              const features = pkg.features ? JSON.parse(pkg.features) : [];
              return (
                <InternetCard key={pkg.id} package={{
                  id: pkg.id,
                  name: pkg.name,
                  speed: pkg.speed,
                  price: pkg.price,
                  provider: pkg.provider,
                  features: features,
                  highlighted: pkg.highlighted,
                }} />
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Banner - Enhanced */}
      {featuredBanner && (
        <section className="py-12 container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-primary/60 p-8 md:p-12 flex items-center justify-between group">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-36 -mb-36" />
            
            {/* Content */}
            <div className="relative z-10 max-w-2xl">
              <Badge variant="secondary" className="mb-3 bg-white/20 text-white hover:bg-white/30">YENİ ÜRÜN</Badge>
              <h3 className="text-3xl md:text-5xl font-bold font-heading text-white mb-3">{featuredBanner.title}</h3>
              {featuredBanner.description && (
                <p className="text-white/90 mb-6 text-base md:text-lg font-medium">{featuredBanner.description}</p>
              )}
              <Link href={featuredBanner.link}>
                <Button size="lg" className="bg-white hover:bg-white/90 text-primary rounded-full font-bold shadow-xl">
                  {featuredBanner.buttonText}
                </Button>
              </Link>
            </div>
            
            {/* Product Image - Prominent */}
            {featuredBanner.image && (
              <div className="relative z-20 w-1/3 md:w-2/5 hidden md:flex">
                <motion.img 
                  initial={{ y: 20, opacity: 0.8 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  src={featuredBanner.image}
                  alt={featuredBanner.title || "Öne çıkan banner"}
                  loading="lazy"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* More Products */}
      <section className="py-8 pb-24 md:pb-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Sizin İçin Seçtiklerimiz
            </h2>
            <Link href="/products" className="text-sm font-semibold text-primary flex items-center hover:gap-2 transition-all">
              Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {moreProducts.map((product) => (
              <ProductCard key={product.id} product={{
                id: product.id,
                title: product.title,
                price: product.price,
                category: "",
                image: product.image || "",
                isNew: product.isNew,
                originalPrice: product.originalPrice || undefined,
                limitedStock: product.limitedStock || undefined,
                slug: product.slug || undefined,
              }} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
