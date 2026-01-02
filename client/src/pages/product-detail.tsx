import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, MessageCircle, Facebook, Twitter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { getProductStructuredData, getBreadcrumbStructuredData } from "@/lib/structuredData";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import ReviewForm from "@/components/ReviewForm";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number | string;
  originalPrice: number | string | null;
  image: string | null;
  categoryId: string;
  isNew: boolean;
  inStock: boolean;
  // SEO fields
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  slug?: string | null;
  // Product identification
  sku?: string | null;
  brand?: string | null;
  gtin?: string | null;
  mpn?: string | null;
}

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const [, params] = useRoute("/product/:id");
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { usdToTry } = useExchangeRate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Keyboard navigation for image modal
  useEffect(() => {
    if (!isImageModalOpen || images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setModalImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setModalImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setIsImageModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageModalOpen, images.length]);

  // Sync modal image index with selected image
  useEffect(() => {
    if (isImageModalOpen) {
      setModalImageIndex(selectedImage);
    }
  }, [isImageModalOpen, selectedImage]);

  // Update selected image when modal image changes
  useEffect(() => {
    if (isImageModalOpen) {
      setSelectedImage(modalImageIndex);
    }
  }, [modalImageIndex, isImageModalOpen]);

  useEffect(() => {
    if (params?.id) {
      // Optimized: Single API call - backend handles both slug and ID
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/products/${params.id}`);
          if (!res.ok) {
            throw new Error("Product not found");
          }
          const data = await res.json();
          
          // SEO: Redirect to slug URL if accessed by ID (301 redirect for SEO)
          if (data._shouldRedirect && data._canonicalUrl && data.slug) {
            // Use replace to avoid adding to history (301-like behavior)
            window.location.replace(data._canonicalUrl);
            return;
          }
          
          // Update title immediately when product data is available
          const productTitle = data.metaTitle || data.title || "Ürün";
          document.title = `${productTitle} | VeloPix Computer`;
          
          setProduct(data);
          
          // Fetch category
          if (data.categoryId) {
            fetch(`/api/categories/${data.categoryId}`)
              .then((catRes) => catRes.json())
              .then((catData) => setCategory(catData.name || ""))
              .catch(() => setCategory(""));
          }

          // Fetch images
          fetch(`/api/products/${data.id}/images`)
            .then((imgRes) => imgRes.json())
            .then((imgData) => {
              const imageUrls = imgData.map((img: any) => img.imageUrl);
              if (data.image) imageUrls.unshift(data.image);
              setImages(imageUrls);
            })
            .catch(() => {
              if (data.image) setImages([data.image]);
            });

          // Fetch reviews
          fetch(`/api/products/${data.id}/reviews`)
            .then((revRes) => revRes.json())
            .then((revData) => {
              setReviews(revData.reviews || []);
              setRating(revData.rating || { average: 0, count: 0 });
            })
            .catch(() => {});

          // Fetch related products
          fetch(`/api/products/${data.id}/related`)
            .then((relRes) => relRes.json())
            .then((relData) => setRelatedProducts(relData))
            .catch(() => {});

          // Parse specifications
          if (data.specifications) {
            try {
              const specs = typeof data.specifications === 'string' 
                ? JSON.parse(data.specifications) 
                : data.specifications;
              setSpecifications(specs);
            } catch {
              setSpecifications({});
            }
          }

          setLoading(false);
        } catch (error) {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [params?.id]);

  // Build product URL - prefer slug over id
  const productUrl = product?.slug 
    ? `/product/${product.slug}`
    : product?.id 
      ? `/product/${product.id}`
      : undefined;

  // Use meta fields if available, otherwise fallback to defaults
  // SEO Title: Optimize for 50-60 characters
  // Update title immediately when product changes (before useSEO hook runs)
  const seoTitle = product?.metaTitle || product?.title || "Ürün";
  
  // Update title immediately when product is available (for faster SEO)
  useEffect(() => {
    if (product) {
      document.title = `${seoTitle} | VeloPix Computer`;
    }
  }, [product, seoTitle]);
  
  // SEO Description: Optimize for 150-160 characters
  let seoDescription = product?.metaDescription || product?.description || "";
  if (!seoDescription && product?.title) {
    seoDescription = `${product.title} - ${category || "Teknoloji"} kategorisinde en uygun fiyat. Hızlı teslimat ve güvenli ödeme.`;
  }
  if (seoDescription.length > 160) {
    seoDescription = seoDescription.substring(0, 157) + "...";
  }
  if (!seoDescription) {
    seoDescription = "Ürün detayları ve özellikleri. En iyi fiyat garantisi ile hızlı teslimat.";
  }
  
  // SEO Keywords: Combine product title, category, and relevant terms
  const seoKeywords = product?.metaKeywords || (product 
    ? `${product.title}, ${category || "teknoloji"}, ${product.brand || ""}, teknoloji, elektronik, bilgisayar, laptop, telefon`.replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "")
    : undefined);
  
  // SEO Image: Use absolute URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  let seoImage = product?.ogImage || product?.image || undefined;
  if (seoImage && !seoImage.startsWith("http")) {
    seoImage = `${baseUrl}${seoImage.startsWith("/") ? "" : "/"}${seoImage}`;
  }
  
  const productPrice = typeof product?.price === "string" ? parseFloat(product.price) : product?.price;
  
  // Prepare reviews for structured data
  const reviewsForStructuredData = reviews.map((review) => ({
    author: review.customerName || "Müşteri",
    datePublished: review.createdAt || new Date().toISOString(),
    reviewBody: review.comment || "",
    reviewRating: {
      ratingValue: review.rating || 5,
      bestRating: 5,
    },
  }));

  useSEO({
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    image: seoImage,
    url: productUrl,
    type: "product",
    productPrice: productPrice,
    productCurrency: "USD", // Price displayed in USD
    productAvailability: product?.inStock !== false ? "in stock" : "out of stock",
    structuredData: product ? [
      getProductStructuredData({
        id: product.id,
        title: product.title,
        description: product.description || seoDescription,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        ogImage: product.ogImage,
        category: category,
        inStock: product.inStock,
        slug: product.slug,
        sku: product.sku,
        brand: product.brand,
        gtin: product.gtin,
        mpn: product.mpn,
        ratingValue: rating.average,
        reviewCount: rating.count,
        reviews: reviewsForStructuredData,
      }),
      getBreadcrumbStructuredData([
        { name: "Ana Sayfa", url: "/" },
        { name: "Ürünler", url: "/products" },
        { name: product.title, url: productUrl || `/product/${product.id}` },
      ]),
    ] : undefined,
  });

  const sku = product?.sku || product?.id || "";

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
        image: product.image || "",
        category: category,
      },
      quantity
    );
    toast({
      title: "Sepete eklendi",
      description: `${product.title} (${quantity} adet) sepete eklendi.`,
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

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Ürün Bulunamadı</h1>
          <p className="text-muted-foreground">Aradığınız ürün bulunamadı.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="bg-secondary rounded-2xl p-8 flex items-center justify-center aspect-square">
              <img 
                src={images[selectedImage] || product?.image || ""} 
                alt={product?.title || "Ürün görseli"} 
                className="w-full h-full object-contain cursor-zoom-in"
                loading={selectedImage === 0 ? "eager" : "lazy"}
                fetchPriority={selectedImage === 0 ? "high" : "auto"}
                decoding="async"
                onClick={() => {
                  setModalImageIndex(selectedImage);
                  setIsImageModalOpen(true);
                }}
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx);
                      setModalImageIndex(idx);
                      setIsImageModalOpen(true);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? "border-primary" : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product?.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Image Modal */}
          <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
            <DialogContent className="max-w-7xl w-full p-0 bg-black/95 border-none">
              <div className="relative w-full h-[90vh] flex items-center justify-center">
                {/* Close Button */}
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  aria-label="Kapat"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Previous Button */}
                {images.length > 1 && (
                  <button
                    onClick={() => setModalImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Önceki görsel"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Main Image */}
                <img
                  src={images[modalImageIndex] || product?.image || ""}
                  alt={product?.title || "Ürün görseli"}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Next Button */}
                {images.length > 1 && (
                  <button
                    onClick={() => setModalImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Sonraki görsel"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                    {modalImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Thumbnails at bottom */}
                {images.length > 1 && (
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/30 rounded-lg backdrop-blur-sm">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setModalImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                          modalImageIndex === idx ? "border-white" : "border-transparent hover:border-white/50"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product?.title} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-between"
          >
            <div>
              <Badge className="mb-2">YENİ</Badge>
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-3">
                {product?.title || "Ürün"}
              </h1>

              {/* Rating */}
              {rating.count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(rating.average) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {rating.average.toFixed(1)} ({rating.count} yorum)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-primary">
                      ${typeof product?.price === "string" ? parseFloat(product.price).toFixed(2) : product?.price?.toFixed(2) || "0.00"}
                    </span>
                    {product?.originalPrice && (
                      <>
                        <span className="text-xl text-muted-foreground line-through">
                          ${typeof product.originalPrice === "string" ? parseFloat(product.originalPrice).toFixed(2) : product.originalPrice.toFixed(2)}
                        </span>
                        <Badge className="bg-red-500">
                          {Math.round(
                            ((parseFloat(typeof product.originalPrice === "string" ? product.originalPrice : product.originalPrice.toString()) - 
                              parseFloat(typeof product.price === "string" ? product.price : product.price.toString())) / 
                             parseFloat(typeof product.originalPrice === "string" ? product.originalPrice : product.originalPrice.toString())) * 100
                          )}% İndirim
                        </Badge>
                      </>
                    )}
                  </div>
                  {product?.price && (
                    <div className="text-lg text-muted-foreground">
                      ≈ {usdToTry(product.price).toFixed(2)} ₺
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="flex gap-4 border-b mb-4">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`pb-2 px-2 font-semibold ${
                      activeTab === "description"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Açıklama
                  </button>
                  {Object.keys(specifications).length > 0 && (
                    <button
                      onClick={() => setActiveTab("specifications")}
                      className={`pb-2 px-2 font-semibold ${
                        activeTab === "specifications"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Özellikler
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`pb-2 px-2 font-semibold ${
                      activeTab === "reviews"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Yorumlar ({rating.count})
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "description" && product?.description && (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {product.description}
                  </div>
                )}

                {activeTab === "specifications" && Object.keys(specifications).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <span className="font-semibold">{key}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-6">
                    {/* Review Form */}
                    <div className="bg-secondary p-6 rounded-lg">
                      <h3 className="font-bold mb-4">Yorum Yap</h3>
                      <ReviewForm productId={product?.id || ""} onReviewAdded={() => {
                        // Refresh reviews
                        if (product?.id) {
                          fetch(`/api/products/${product.id}/reviews`)
                            .then((revRes) => revRes.json())
                            .then((revData) => {
                              setReviews(revData.reviews || []);
                              setRating(revData.rating || { average: 0, count: 0 });
                            })
                            .catch(() => {});
                        }
                      }} />
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <p className="text-muted-foreground">Henüz yorum yapılmamış.</p>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="border-b pb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-semibold">{review.customerName}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Section */}
            <div>
              {/* Stock Status */}
              <div className={`border rounded-lg p-3 mb-4 text-sm ${
                product?.inStock !== false 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                ✓ {product?.inStock !== false ? "Stokta Mevcut" : "Stok Dışı"}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-semibold">Adet:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-secondary transition">-</button>
                  <span className="px-4 py-2 font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-secondary transition">+</button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-4">
                <Button size="lg" onClick={handleAddToCart} className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Sepete Ekle
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => {
                    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                    if (wishlist.includes(product.id)) {
                      const updated = wishlist.filter((id: string) => id !== product.id);
                      localStorage.setItem("wishlist", JSON.stringify(updated));
                      toast({ title: "Favorilerden çıkarıldı" });
                    } else {
                      wishlist.push(product.id);
                      localStorage.setItem("wishlist", JSON.stringify(wishlist));
                      toast({ title: "Favorilere eklendi" });
                    }
                  }}
                >
                  <Heart className="w-5 h-5" />
                </Button>
                <div className="relative group">
                  <Button size="lg" variant="outline" className="rounded-full">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 hidden group-hover:block z-10">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const url = window.location.href;
                          const message = `${product?.title} - ${url}`;
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, "_blank");
                        }}
                        className="p-2 hover:bg-secondary rounded"
                        title="WhatsApp'ta Paylaş"
                      >
                        <MessageCircle className="w-5 h-5 text-green-500" />
                      </button>
                      <button
                        onClick={() => {
                          const url = window.location.href;
                          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                          window.open(facebookUrl, "_blank");
                        }}
                        className="p-2 hover:bg-secondary rounded"
                        title="Facebook'ta Paylaş"
                      >
                        <Facebook className="w-5 h-5 text-blue-500" />
                      </button>
                      <button
                        onClick={() => {
                          const url = window.location.href;
                          const text = product?.title || "";
                          const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                          window.open(twitterUrl, "_blank");
                        }}
                        className="p-2 hover:bg-secondary rounded"
                        title="Twitter'da Paylaş"
                      >
                        <Twitter className="w-5 h-5 text-blue-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Ücretsiz Kargo (50$ üzeri)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>2 Yıl Garantili</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <span>30 Gün Para İade Garantisi</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-heading mb-6">Benzer Ürünler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    const url = relatedProduct.slug 
                      ? `/product/${relatedProduct.slug}`
                      : relatedProduct.slug 
                        ? `/product/${relatedProduct.slug}`
                        : `/product/${relatedProduct.id}`;
                    window.location.href = url;
                  }}
                >
                  <div className="bg-secondary aspect-square rounded-lg mb-4 m-4 flex items-center justify-center">
                    {relatedProduct.image && (
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.title}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="px-4 pb-4">
                    <h3 className="font-bold mb-2 line-clamp-2 text-sm">{relatedProduct.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${typeof relatedProduct.price === "string" 
                          ? parseFloat(relatedProduct.price).toFixed(2) 
                          : relatedProduct.price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
