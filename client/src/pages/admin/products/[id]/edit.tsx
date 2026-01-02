import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useRoute } from "wouter";
import AdminLayout from "../../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Search, Loader2, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  originalPrice: string | number | null;
  image: string | null;
  categoryId: string;
  isNew: boolean;
  limitedStock: number | null;
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

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProductEdit() {
  const [, params] = useRoute<{ id?: string; slug?: string }>("/admin/products/:idOrSlug/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [productImages, setProductImages] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);
  const [productId, setProductId] = useState<string>("");
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [searchingImages, setSearchingImages] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ url: string; thumbnail: string; title: string }>>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(new Set());
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null); // Ana görsel URL'i

  // Product Images Manager Component
  function ProductImagesManager({ productId, images, onUpdate, onSetPrimaryImage }: { productId: string; images: any[]; onUpdate: () => void; onSetPrimaryImage?: (imageUrl: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Görsel yüklenemedi");
        const { url } = await uploadRes.json();

        const addRes = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageUrl: url, alt: "", order: images.length, isPrimary: false }),
        });

        if (!addRes.ok) throw new Error("Görsel eklenemedi");
        toast({ title: "Başarılı", description: "Görsel eklendi" });
        onUpdate();
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message || "Görsel eklenemedi",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    };

    const handleDeleteImage = async (imageId: string) => {
      if (!confirm("Bu görseli silmek istediğinize emin misiniz?")) return;

      try {
        const res = await fetch(`/api/admin/products/images/${imageId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Görsel silinemedi");
        toast({ title: "Başarılı", description: "Görsel silindi" });
        onUpdate();
      } catch (error) {
        toast({
          title: "Hata",
          description: "Görsel silinemedi",
          variant: "destructive",
        });
      }
    };

    const handleSetPrimaryImage = async (imageId: string, imageUrl: string) => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/images/${imageId}/set-primary`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Ana görsel ayarlanamadı");
        }

        toast({ title: "Başarılı", description: "Ana görsel güncellendi" });
        
        // Ürün ana görselini güncelle
        if (onSetPrimaryImage) {
          onSetPrimaryImage(imageUrl);
        }
        
        onUpdate(); // Görselleri yeniden yükle
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message || "Ana görsel ayarlanamadı",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Ürün için birden fazla görsel ekleyebilirsiniz</p>
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddImage}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {uploading ? "Yükleniyor..." : "Görsel Ekle"}
            </Button>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Henüz görsel eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((img) => (
                <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                  <img
                    src={img.imageUrl}
                    alt={img.alt || "Ürün görseli"}
                    className="w-full h-32 object-cover"
                  />
                  {img.isPrimary && (
                    <Badge className="absolute top-2 left-2 bg-primary">Ana Görsel</Badge>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.isPrimary && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSetPrimaryImage(img.id, img.imageUrl)}
                        title="Ana Görsel Yap"
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteImage(img.id)}
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    categoryId: "",
    isNew: false,
    limitedStock: "",
    inStock: true,
    // SEO fields
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
    slug: "",
    // Product identification
    sku: "",
    brand: "",
    gtin: "",
    mpn: "",
  });

  const token = localStorage.getItem("adminToken");
  const productIdOrSlug = params?.id || params?.slug || params?.idOrSlug;

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    if (productIdOrSlug) {
      Promise.all([fetchProduct(), fetchCategories()]);
    }
  }, [token, productIdOrSlug, setLocation]);

  // productId set edildikten sonra görselleri yükle
  useEffect(() => {
    const loadImages = async () => {
      const idToUse = productId || productIdOrSlug;
      if (!idToUse) return;
      try {
        const res = await fetch(`/api/products/${idToUse}/images`);
        if (res.ok) {
          const data = await res.json();
          setProductImages(data || []);
        } else {
          console.error("Failed to fetch product images:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch product images:", error);
      }
    };
    
    if (productId || productIdOrSlug) {
      loadImages();
    }
  }, [productId, productIdOrSlug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${productIdOrSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Ürün bulunamadı");
      }
      const product: Product = await res.json();
      setProductId(product.id);
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: typeof product.price === "string" ? product.price : product.price.toString(),
        originalPrice: product.originalPrice
          ? typeof product.originalPrice === "string"
            ? product.originalPrice
            : product.originalPrice.toString()
          : "",
        image: product.image || "",
        categoryId: product.categoryId,
        isNew: product.isNew,
        limitedStock: product.limitedStock?.toString() || "",
        inStock: product.inStock,
        // SEO fields
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        metaKeywords: product.metaKeywords || "",
        ogImage: product.ogImage || "",
        slug: product.slug || "",
        // Product identification
        sku: product.sku || "",
        brand: product.brand || "",
        gtin: product.gtin || "",
        mpn: product.mpn || "",
      });
        
        // Parse specifications into key-value pairs
        if (product.specifications) {
          try {
            const specs = typeof product.specifications === 'string' 
              ? JSON.parse(product.specifications) 
              : product.specifications;
            if (specs && typeof specs === 'object') {
              setSpecifications(
                Object.entries(specs).map(([key, value]) => ({
                  key: String(key),
                  value: String(value),
                }))
              );
            }
          } catch (e) {
            console.error("Error parsing specifications:", e);
            setSpecifications([]);
          }
        } else {
          setSpecifications([]);
        }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ürün yüklenemedi",
        variant: "destructive",
      });
      setLocation("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kategoriler yüklenemedi",
        variant: "destructive",
      });
    }
  };

  // Generate slug from title
  const generateSlug = (title: string): string => {
    const turkishCharMap: { [key: string]: string } = {
      ç: "c", Ç: "c",
      ğ: "g", Ğ: "g",
      ı: "i", İ: "i",
      ö: "o", Ö: "o",
      ş: "s", Ş: "s",
      ü: "u", Ü: "u",
    };

    return title
      .split("")
      .map((char) => turkishCharMap[char] || char)
      .join("")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Boş string'leri null'a çevir ve değerleri doğru formata getir
      const payload: any = {
        title: formData.title,
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice && formData.originalPrice.trim() 
          ? parseFloat(formData.originalPrice) 
          : null,
        image: formData.image.trim() || null,
        categoryId: formData.categoryId,
        isNew: formData.isNew,
        limitedStock: formData.limitedStock && formData.limitedStock.trim()
          ? parseInt(formData.limitedStock)
          : null,
        inStock: formData.inStock,
        // SEO fields
        metaTitle: formData.metaTitle.trim() || null,
        metaDescription: formData.metaDescription.trim() || null,
        metaKeywords: formData.metaKeywords.trim() || null,
        ogImage: formData.ogImage.trim() || null,
        // Generate slug from title if slug is empty
        slug: formData.slug.trim() || (formData.title ? generateSlug(formData.title) : null),
        // Product identification
        sku: formData.sku.trim() || null,
        brand: formData.brand.trim() || null,
        gtin: formData.gtin.trim() || null,
        mpn: formData.mpn.trim() || null,
        specifications: specifications.length > 0
          ? JSON.stringify(
              specifications
                .filter((spec) => spec.key.trim() && spec.value.trim())
                .reduce((acc, spec) => {
                  acc[spec.key.trim()] = spec.value.trim();
                  return acc;
                }, {} as Record<string, string>)
            )
          : null,
      };

      // Validation kontrolü
      if (!payload.title || !payload.categoryId || isNaN(payload.price) || payload.price <= 0) {
        throw new Error("Lütfen tüm gerekli alanları doldurun");
      }

      const res = await fetch(`/api/admin/products/${productIdOrSlug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ürün güncellenemedi");
      }

      toast({ title: "Başarılı", description: "Ürün güncellendi" });
      fetchProduct();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ürün güncellenemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageSearch = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Uyarı",
        description: "Önce ürün adını girin",
        variant: "destructive",
      });
      return;
    }

    setSearchingImages(true);
    setSearchResults([]);
    setSelectedImages(new Set());
    setPrimaryImageUrl(null); // Ana görsel seçimini sıfırla

    try {
      const res = await fetch(`/api/admin/search-images?q=${encodeURIComponent(formData.title)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Görsel arama başarısız");
      }

      const data = await res.json();
      const images = data.images || [];
      setSearchResults(images);
      if (images.length > 0) {
        setImageSearchOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Görseller aranırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setSearchingImages(false);
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageUrl)) {
      newSelected.delete(imageUrl);
      // Eğer ana görsel seçimi kaldırılıyorsa, ana görsel seçimini de temizle
      if (primaryImageUrl === imageUrl) {
        setPrimaryImageUrl(null);
      }
    } else {
      newSelected.add(imageUrl);
      // İlk seçilen görseli otomatik olarak ana görsel yap
      if (newSelected.size === 1) {
        setPrimaryImageUrl(imageUrl);
      }
    }
    setSelectedImages(newSelected);
  };

  const setAsPrimary = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Tıklama event'ini durdur
    setPrimaryImageUrl(imageUrl);
  };

  const handleDownloadSelectedImages = async () => {
    if (selectedImages.size === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir görsel seçin",
        variant: "destructive",
      });
      return;
    }

    // searchResults'tan sırayı koru (Set sırası garanti değil)
    const imagesToDownload = searchResults
      .filter(img => selectedImages.has(img.url))
      .map(img => img.url);
    
    setDownloadingImages(new Set(imagesToDownload));

    try {
      // Seçilen görsellerin sırasını koru - URL'leri ve indirilen URL'leri eşleştir
      const primarySelectedUrl = primaryImageUrl || imagesToDownload[0];
      const primaryIndexInDownload = primarySelectedUrl ? imagesToDownload.findIndex(url => url === primarySelectedUrl) : 0;
      
      // Her görseli indir ve URL eşleştirmesini koru
      const downloadResults = await Promise.all(
        imagesToDownload.map(async (imageUrl, index) => {
          const res = await fetch("/api/admin/download-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageUrl }),
          });

          if (!res.ok) {
            throw new Error(`Failed to download image: ${imageUrl}`);
          }

          const data = await res.json();
          return {
            originalUrl: imageUrl,
            downloadedUrl: data.url,
            isPrimary: index === primaryIndexInDownload
          };
        })
      );
      
      // Ana görseli belirle
      const primaryResult = downloadResults.find(r => r.isPrimary) || downloadResults[0];
      const galleryResults = downloadResults.filter(r => !r.isPrimary);
      
      // Tüm görselleri ürün görselleri galerisine ekle (ana görsel hariç)
      if (downloadResults.length > 0 && productId) {
        try {
          // Ana görseli formData'ya ekle (galeriye ekleme)
          if (primaryResult) {
            setFormData((prev) => ({
              ...prev,
              image: primaryResult.downloadedUrl,
              ogImage: prev.ogImage || primaryResult.downloadedUrl,
            }));
          }

          // Ana görsel hariç diğer görselleri galeriye ekle
          if (galleryResults.length > 0) {
            const addImagePromises = galleryResults.map(async (result, index) => {
              const res = await fetch(`/api/admin/products/${productId}/images`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                  imageUrl: result.downloadedUrl, 
                  alt: "", 
                  order: productImages.length + index, 
                  isPrimary: false // Ana görsel değil
                }),
              });
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Failed to add image: ${errorData.error || res.statusText}`);
              }
              return await res.json();
            });

            await Promise.all(addImagePromises);
          }

          // Görselleri yeniden yükle
          const idToUse = productId || productIdOrSlug;
          if (idToUse) {
            try {
              const res = await fetch(`/api/products/${idToUse}/images`);
              if (res.ok) {
                const data = await res.json();
                setProductImages(data || []);
              }
            } catch (error) {
              console.error("Failed to refresh product images:", error);
            }
          }

          toast({
            title: "Başarılı",
            description: `${downloadResults.length} görsel başarıyla yüklendi. ${primaryResult ? '1 görsel ana görsel olarak ayarlandı' : ''}${galleryResults.length > 0 ? `, ${galleryResults.length} görsel ürün görselleri galerisine eklendi.` : '.'}`,
          });
        } catch (error: any) {
          console.error("Failed to add images to gallery:", error);
          toast({
            title: "Kısmi Başarı",
            description: `Görseller indirildi ancak galeriye eklenirken bir hata oluştu: ${error.message}`,
            variant: "destructive",
          });
        }
      } else if (downloadResults.length > 0) {
        // Eğer productId yoksa (yeni ürün), sadece formData'ya ekle
        const primaryDownloadedUrl = primaryResult?.downloadedUrl || downloadResults[0].downloadedUrl;
        setFormData((prev) => ({
          ...prev,
          image: primaryDownloadedUrl,
          ogImage: prev.ogImage || primaryDownloadedUrl,
        }));
        toast({
          title: "Başarılı",
          description: `${downloadResults.length} görsel başarıyla yüklendi. Ana görsel olarak ayarlandı. Ürünü kaydettikten sonra diğer görselleri de ekleyebilirsiniz.`,
        });
      }

      setImageSearchOpen(false);
      setSelectedImages(new Set());
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Görseller indirilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setDownloadingImages(new Set());
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Hata",
        description: "Sadece resim dosyaları yüklenebilir",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Görsel yüklenemedi");
      }

      const data = await res.json();
      setFormData((prev) => ({ 
        ...prev, 
        image: data.url,
        // Otomatik olarak ogImage'e de ekle (eğer boşsa)
        ogImage: prev.ogImage || data.url
      }));
      toast({
        title: "Başarılı",
        description: "Görsel yüklendi ve Open Graph görseli olarak ayarlandı",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Görsel yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Ürün Düzenle</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Ürün Düzenle</h1>
            <p className="text-muted-foreground">Ürün bilgilerini düzenleyin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ürün Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Ürün Adı *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug (Boş bırakılırsa otomatik oluşturulur)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="URL-friendly versiyonu (boş bırakılırsa otomatik oluşturulur)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL-friendly versiyonu (örn: gaming-laptop). Boş bırakılırsa ürün adından otomatik oluşturulur.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Fiyat *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">Orijinal Fiyat</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="image">Ürün Görseli</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="imageUpload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? "Yükleniyor..." : "Görsel Yükle"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleImageSearch}
                          disabled={searchingImages || !formData.title.trim()}
                          className="flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          {searchingImages ? "Aranıyor..." : "Görsel Öner"}
                        </Button>
                        {formData.image && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormData({ ...formData, image: "" })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {formData.image && (
                        <div className="mt-2">
                          <img
                            src={formData.image}
                            alt="Ürün görseli"
                            className="max-w-md h-48 object-cover rounded-lg border"
                          />
                          <p className="text-sm text-muted-foreground mt-1">{formData.image}</p>
                        </div>
                      )}
                      <Input
                        id="image"
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="Veya görsel URL'si girin (opsiyonel)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Images Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Ürün Görselleri ({productImages.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProductImagesManager
                    productId={productId}
                    images={productImages}
                    onUpdate={async () => {
                      // Görselleri yeniden yükle
                      const idToUse = productId || productIdOrSlug;
                      if (!idToUse) return;
                      try {
                        const res = await fetch(`/api/products/${idToUse}/images`);
                        if (res.ok) {
                          const data = await res.json();
                          setProductImages(data || []);
                        }
                      } catch (error) {
                        console.error("Failed to fetch product images:", error);
                      }
                    }}
                    onSetPrimaryImage={(imageUrl: string) => {
                      // Ürün ana görselini güncelle
                      setFormData((prev) => ({
                        ...prev,
                        image: imageUrl,
                        ogImage: prev.ogImage || imageUrl,
                      }));
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Başlık</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="Arama motorları için başlık"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Boş bırakılırsa ürün adı kullanılır
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Açıklama</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      rows={3}
                      placeholder="Arama motorları için açıklama (150-160 karakter önerilir)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaKeywords">Meta Anahtar Kelimeler</Label>
                    <Input
                      id="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      placeholder="virgülle ayrılmış anahtar kelimeler"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ogImage">Open Graph Görseli</Label>
                    <Input
                      id="ogImage"
                      type="text"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      placeholder="Sosyal medya paylaşımları için görsel URL"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Boş bırakılırsa ürün görseli kullanılır
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ürün Tanımlayıcıları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Stok kodu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Marka</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ürün markası"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gtin">GTIN/EAN</Label>
                    <Input
                      id="gtin"
                      value={formData.gtin}
                      onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                      placeholder="GTIN veya EAN kodu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpn">MPN</Label>
                    <Input
                      id="mpn"
                      value={formData.mpn}
                      onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                      placeholder="Manufacturer Part Number"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ürün Özellikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {specifications.map((spec, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Özellik adı (örn: Ekran)"
                            value={spec.key}
                            onChange={(e) => {
                              const newSpecs = [...specifications];
                              newSpecs[index].key = e.target.value;
                              setSpecifications(newSpecs);
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Değer (örn: 15.6 inç)"
                            value={spec.value}
                            onChange={(e) => {
                              const newSpecs = [...specifications];
                              newSpecs[index].value = e.target.value;
                              setSpecifications(newSpecs);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSpecifications(specifications.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSpecifications([...specifications, { key: "", value: "" }])}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Özellik Ekle
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Ürün özelliklerini key-value çiftleri olarak ekleyin (örn: Ekran - 15.6 inç)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ayarlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="categoryId">Kategori *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, categoryId: value });
                        setCategorySearchTerm(""); // Seçim yapıldığında arama terimini temizle
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        <div className="p-2 sticky top-0 bg-background z-10 border-b">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Kategori ara..."
                              value={categorySearchTerm}
                              onChange={(e) => {
                                e.stopPropagation();
                                setCategorySearchTerm(e.target.value);
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {categories
                            .filter((cat) =>
                              cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                              cat.slug.toLowerCase().includes(categorySearchTerm.toLowerCase())
                            )
                            .length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              {categorySearchTerm ? "Kategori bulunamadı" : "Kategori bulunamadı"}
                            </div>
                          ) : (
                            categories
                              .filter((cat) =>
                                cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                                cat.slug.toLowerCase().includes(categorySearchTerm.toLowerCase())
                              )
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="limitedStock">Stok Limiti</Label>
                    <Input
                      id="limitedStock"
                      type="number"
                      value={formData.limitedStock}
                      onChange={(e) => setFormData({ ...formData, limitedStock: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isNew"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isNew">Yeni Ürün</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={formData.inStock}
                      onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="inStock">Stokta Var</Label>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Link href="/admin/products" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    İptal
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Image Search Dialog */}
        <Dialog open={imageSearchOpen} onOpenChange={setImageSearchOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Görsel Önerileri</DialogTitle>
              <DialogDescription>
                Ürün adına göre Bing'den bulunan görseller. Beğendiğiniz görselleri seçip yükleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {searchingImages ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Görseller aranıyor...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Görsel bulunamadı
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map((image, index) => {
                    const isSelected = selectedImages.has(image.url);
                    const isDownloading = downloadingImages.has(image.url);
                    const isPrimary = primaryImageUrl === image.url;
                    return (
                      <div
                        key={index}
                        className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          isSelected ? "border-primary ring-2 ring-primary" : "border-border"
                        } ${isPrimary ? "ring-4 ring-yellow-400 border-yellow-400" : ""}`}
                        onClick={() => toggleImageSelection(image.url)}
                      >
                        <div className="aspect-square relative bg-muted">
                          <img
                            src={image.thumbnail || image.url}
                            alt={image.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Thumbnail yüklenemezse orijinal URL'i dene
                              if (image.thumbnail && image.url && (e.target as HTMLImageElement).src !== image.url) {
                                (e.target as HTMLImageElement).src = image.url;
                              } else {
                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EGörsel yüklenemedi%3C/text%3E%3C/svg%3E";
                              }
                            }}
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isSelected ? "opacity-100" : ""
                            }`}
                          >
                            {isSelected && !isDownloading && (
                              <div className="flex flex-col items-center gap-2">
                                <div className="bg-primary rounded-full p-2">
                                  <Check className="w-6 h-6 text-white" />
                                </div>
                                {isPrimary && (
                                  <Badge className="bg-yellow-500 text-white">Ana Görsel</Badge>
                                )}
                              </div>
                            )}
                            {isDownloading && (
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            )}
                          </div>
                          {/* Ana görsel badge - her zaman görünür */}
                          {isPrimary && isSelected && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-yellow-500 text-white">⭐ Ana Görsel</Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-background">
                          <p className="text-xs text-muted-foreground truncate" title={image.title}>
                            {image.title}
                          </p>
                          {isSelected && (
                            <Button
                              type="button"
                              variant={isPrimary ? "default" : "outline"}
                              size="sm"
                              className="w-full mt-2 text-xs"
                              onClick={(e) => setAsPrimary(image.url, e)}
                            >
                              {isPrimary ? "✓ Ana Görsel" : "Ana Görsel Yap"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImageSearchOpen(false);
                      setSelectedImages(new Set());
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleDownloadSelectedImages}
                    disabled={selectedImages.size === 0 || downloadingImages.size > 0}
                  >
                    {downloadingImages.size > 0
                      ? `Yükleniyor... (${downloadingImages.size})`
                      : `Seçilen Görselleri Yükle (${selectedImages.size})`}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

