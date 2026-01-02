import { Layout } from "@/components/layout";
import ProductCard from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData } from "@/lib/structuredData";
import { useLocation } from "wouter";

interface Product {
  id: string;
  title: string;
  price: string;
  image: string | null;
  categoryId: string;
  isNew: boolean;
  limitedStock: number | null;
  originalPrice: string | null;
  slug?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
  productCount?: number;
}

export default function Products() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [inStockFilter, setInStockFilter] = useState<boolean | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");

  useSEO({
    title: "Ürünler",
    description: "Gaming bilgisayar, laptop, telefon ve teknoloji ürünlerinde geniş ürün yelpazesi. En iyi fiyatlar ve hızlı teslimat.",
    keywords: "gaming bilgisayar, laptop, telefon, teknoloji ürünleri, elektronik",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "Ürünler", url: "/products" },
    ]),
  });

  // Fetch hierarchical categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRes = await fetch("/api/categories?hierarchical=true");
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        
        // Get category from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const categorySlug = urlParams.get("category");
        if (categorySlug) {
          const findCategory = (cats: Category[]): Category | null => {
            for (const cat of cats) {
              if (cat.slug === categorySlug) return cat;
              if (cat.children) {
                const found = findCategory(cat.children);
                if (found) return found;
              }
            }
            return null;
          };
          const category = findCategory(categoriesData);
          if (category) {
            console.log(`[Products] Found category by slug "${categorySlug}":`, { id: category.id, name: category.name, slug: category.slug, children: category.children?.length || 0 });
            setSelectedCategory(category.id);
            // Expand parent categories
            const expandParents = (cat: Category, cats: Category[]): void => {
              if (cat.parentId) {
                setExpandedCategories(prev => new Set(prev).add(cat.parentId!));
                const parent = cats.find(c => c.id === cat.parentId);
                if (parent) expandParents(parent, cats);
              }
            };
            expandParents(category, categoriesData);
          } else {
            console.warn(`[Products] Category with slug "${categorySlug}" not found`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [location]);

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append("categoryId", selectedCategory);
        if (searchTerm) queryParams.append("search", searchTerm);
        if (priceRange[0] > 0) queryParams.append("minPrice", priceRange[0].toString());
        if (priceRange[1] < 2000) queryParams.append("maxPrice", priceRange[1].toString());
        if (selectedBrand) queryParams.append("brand", selectedBrand);
        if (inStockFilter !== undefined) queryParams.append("inStock", inStockFilter.toString());
        if (sortBy) queryParams.append("sortBy", sortBy);

        const productsRes = await fetch(`/api/products?${queryParams.toString()}`);
        const productsData = await productsRes.json();
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Extract unique brands
        const uniqueBrands = Array.from(new Set(productsData.map((p: any) => p.brand).filter(Boolean)));
        setBrands(uniqueBrands as string[]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, searchTerm, priceRange, selectedBrand, inStockFilter, sortBy]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handlePriceRangeSelect = (range: string) => {
    setSelectedPriceRange(range);
    switch (range) {
      case "0-100":
        setPriceRange([0, 100]);
        break;
      case "100-300":
        setPriceRange([100, 300]);
        break;
      case "300-500":
        setPriceRange([300, 500]);
        break;
      case "500-1000":
        setPriceRange([500, 1000]);
        break;
      case "1000-2000":
        setPriceRange([1000, 2000]);
        break;
      case "2000+":
        setPriceRange([2000, 10000]);
        break;
      default:
        setPriceRange([0, 2000]);
    }
  };

  const renderCategoryTree = (cats: Category[], level: number = 0) => {
    return cats.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedCategories.has(cat.id);
      const isSelected = selectedCategory === cat.id;

      return (
        <div key={cat.id} className={level > 0 ? "ml-4" : ""}>
          <div className="flex items-center">
            {hasChildren && (
              <button
                onClick={() => toggleCategory(cat.id)}
                className="p-1 hover:bg-secondary rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <button
              onClick={() => {
                if (hasChildren && !isExpanded) {
                  // Alt kategorileri otomatik aç
                  setExpandedCategories(prev => new Set(prev).add(cat.id));
                }
                setSelectedCategory(isSelected ? "" : cat.id);
              }}
              className={`flex-1 text-left px-2 py-1.5 rounded text-sm transition-all ${
                isSelected
                  ? "bg-primary text-white font-semibold"
                  : "hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{cat.name}</span>
                {cat.productCount !== undefined && (
                  <span className={`text-xs ml-2 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                    ({cat.productCount})
                  </span>
                )}
              </div>
            </button>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(cat.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory("");
    setPriceRange([0, 2000]);
    setSelectedPriceRange("");
    setSelectedBrand("");
    setInStockFilter(undefined);
    setSearchTerm("");
  };

  const hasActiveFilters = selectedCategory || selectedPriceRange || selectedBrand || inStockFilter !== undefined || searchTerm;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold font-heading">Ürünler</h1>
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtreler
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Input
              type="search"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
          </div>

          {/* Sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} ürün bulundu
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="date_desc">Yeni Ürünler</option>
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
            </select>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory && (
                <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                  {(() => {
                    const findCategoryName = (cats: Category[]): string => {
                      for (const cat of cats) {
                        if (cat.id === selectedCategory) return cat.name;
                        if (cat.children) {
                          const found = findCategoryName(cat.children);
                          if (found) return found;
                        }
                      }
                      return "";
                    };
                    return findCategoryName(categories);
                  })()}
                  <button onClick={() => setSelectedCategory("")}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedPriceRange && (
                <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                  ${selectedPriceRange.replace("-", " - $")}
                  <button onClick={() => { setSelectedPriceRange(""); setPriceRange([0, 2000]); }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedBrand && (
                <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                  {selectedBrand}
                  <button onClick={() => setSelectedBrand("")}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {inStockFilter !== undefined && (
                <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                  {inStockFilter ? "Stokta Var" : "Stokta Yok"}
                  <button onClick={() => setInStockFilter(undefined)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Tümünü Temizle
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside
            className={`${
              showSidebar ? "block" : "hidden"
            } lg:block w-full lg:w-64 flex-shrink-0 space-y-4`}
          >
            <div className="sticky top-24 space-y-4">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kategoriler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      !selectedCategory
                        ? "bg-primary text-white font-semibold"
                        : "hover:bg-secondary"
                    }`}
                  >
                    Tüm Kategoriler
                  </button>
                  {renderCategoryTree(categories)}
                </CardContent>
              </Card>

              {/* Price Range */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fiyat Aralığı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "$0 - $100", value: "0-100" },
                    { label: "$100 - $300", value: "100-300" },
                    { label: "$300 - $500", value: "300-500" },
                    { label: "$500 - $1,000", value: "500-1000" },
                    { label: "$1,000 - $2,000", value: "1000-2000" },
                    { label: "$2,000+", value: "2000+" },
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => handlePriceRangeSelect(range.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedPriceRange === range.value
                          ? "bg-primary text-white font-semibold"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Brands */}
              {brands.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Marka</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => setSelectedBrand("")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        !selectedBrand
                          ? "bg-primary text-white font-semibold"
                          : "hover:bg-secondary"
                      }`}
                    >
                      Tüm Markalar
                    </button>
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedBrand === brand
                            ? "bg-primary text-white font-semibold"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Stock Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stok Durumu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setInStockFilter(undefined)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      inStockFilter === undefined
                        ? "bg-primary text-white font-semibold"
                        : "hover:bg-secondary"
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setInStockFilter(true)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      inStockFilter === true
                        ? "bg-primary text-white font-semibold"
                        : "hover:bg-secondary"
                    }`}
                  >
                    Stokta Var
                  </button>
                  <button
                    onClick={() => setInStockFilter(false)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      inStockFilter === false
                        ? "bg-primary text-white font-semibold"
                        : "hover:bg-secondary"
                    }`}
                  >
                    Stokta Yok
                  </button>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-12">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ProductCard product={{
                      id: product.id,
                      title: product.title,
                      price: parseFloat(product.price),
                      image: product.image || "",
                      category: "",
                      isNew: product.isNew,
                      limitedStock: product.limitedStock || undefined,
                      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
                      slug: product.slug || undefined,
                    }} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Arama kriterlerine uygun ürün bulunamadı</p>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white rounded-full"
                  onClick={clearAllFilters}
                >
                  Filtreleri Sıfırla
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
