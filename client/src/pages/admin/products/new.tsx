import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Search, Loader2, Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProductNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [searchingImages, setSearchingImages] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ url: string; thumbnail: string; title: string }>>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(new Set());
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null); // Ana görsel URL'i
  const [productImages, setProductImages] = useState<Array<{ id: string; imageUrl: string; alt: string; order: number; isPrimary: boolean }>>([]); // Geçici ürün görselleri
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
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchCategories();
  }, [token, setLocation]);

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
      ç: "c",
      Ç: "c",
      ğ: "g",
      Ğ: "g",
      ı: "i",
      İ: "i",
      ö: "o",
      Ö: "o",
      ş: "s",
      Ş: "s",
      ü: "u",
      Ü: "u",
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

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ürün oluşturulamadı");
      }

      const product = await res.json();
      
      // Ürün görsellerini ekle (eğer varsa)
      if (productImages.length > 0 && product.id) {
        try {
          const addImagePromises = productImages.map(async (img, index) => {
            const res = await fetch(`/api/admin/products/${product.id}/images`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ 
                imageUrl: img.imageUrl, 
                alt: img.alt, 
                order: index, 
                isPrimary: false 
              }),
            });
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(`Failed to add image: ${errorData.error || res.statusText}`);
            }
            return await res.json();
          });

          await Promise.all(addImagePromises);
          toast({ 
            title: "Başarılı", 
            description: `Ürün oluşturuldu ve ${productImages.length} görsel eklendi` 
          });
        } catch (error: any) {
          console.error("Failed to add product images:", error);
          toast({ 
            title: "Kısmi Başarı", 
            description: "Ürün oluşturuldu ancak bazı görseller eklenemedi. Düzenleme sayfasından ekleyebilirsiniz.",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "Başarılı", description: "Ürün oluşturuldu" });
      }
      
      setLocation(`/admin/products/${product.slug || product.id}/edit`);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ürün oluşturulamadı",
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

    try {
      const res = await fetch(`/api/admin/search-images?q=${encodeURIComponent(formData.title)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Görsel arama başarısız");
      }

      const data = await res.json();
      setSearchResults(data.images || []);
      setImageSearchOpen(true);
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

    const imagesToDownload = Array.from(selectedImages);
    setDownloadingImages(new Set(imagesToDownload));

    try {
      const downloadPromises = imagesToDownload.map(async (imageUrl) => {
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
        return data.url;
      });

      const downloadedUrls = await Promise.all(downloadPromises);
      
      // Seçilen görsellerin sırasını koru ve ana görseli belirle
      const selectedImagesArray = Array.from(selectedImages);
      const primarySelectedUrl = primaryImageUrl || selectedImagesArray[0];
      const primaryIndex = primarySelectedUrl ? selectedImagesArray.findIndex(url => url === primarySelectedUrl) : 0;
      const primaryDownloadedUrl = downloadedUrls[primaryIndex >= 0 ? primaryIndex : 0];
      
      // Ana görseli formData'ya ekle
      if (primaryDownloadedUrl) {
        setFormData((prev) => ({
          ...prev,
          image: primaryDownloadedUrl,
          ogImage: prev.ogImage || primaryDownloadedUrl,
        }));
      }

      // Ana görsel dışındaki görselleri ürün görselleri listesine ekle
      const galleryImages = downloadedUrls
        .map((url, index) => {
          if (index === primaryIndex) return null; // Ana görseli atla
          return {
            id: `temp-${Date.now()}-${index}`,
            imageUrl: url,
            alt: "",
            order: productImages.length + (index > primaryIndex ? index - 1 : index),
            isPrimary: false,
          };
        })
        .filter((img): img is { id: string; imageUrl: string; alt: string; order: number; isPrimary: boolean } => img !== null);

      if (galleryImages.length > 0) {
        setProductImages((prev) => [...prev, ...galleryImages]);
      }

      toast({
        title: "Başarılı",
        description: `${downloadedUrls.length} görsel başarıyla yüklendi. ${primaryDownloadedUrl ? '1 görsel ana görsel olarak ayarlandı. ' : ''}${galleryImages.length > 0 ? `${galleryImages.length} görsel ürün görselleri listesine eklendi.` : ''}`,
      });

      setImageSearchOpen(false);
      setSelectedImages(new Set());
      setPrimaryImageUrl(null);
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
            <h1 className="text-3xl font-bold">Yeni Ürün</h1>
            <p className="text-muted-foreground">Yeni bir ürün oluşturun</p>
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
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          title: newTitle,
                          // Auto-generate slug if empty
                          slug: prev.slug || generateSlug(newTitle),
                          // Auto-generate metaTitle if empty
                          metaTitle: prev.metaTitle || newTitle,
                        }));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Otomatik oluşturulur"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL-friendly versiyonu (örn: gaming-laptop)
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Ürün için birden fazla görsel ekleyebilirsiniz</p>
                      <div>
                        <input
                          ref={galleryFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setUploadingImage(true);
                            const formData = new FormData();
                            formData.append("image", file);

                            try {
                              const res = await fetch("/api/admin/upload", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                                body: formData,
                              });

                              if (!res.ok) throw new Error("Görsel yüklenemedi");
                              const { url } = await res.json();

                              setProductImages((prev) => [
                                ...prev,
                                {
                                  id: `temp-${Date.now()}`,
                                  imageUrl: url,
                                  alt: "",
                                  order: prev.length,
                                  isPrimary: false,
                                },
                              ]);
                              toast({ title: "Başarılı", description: "Görsel eklendi" });
                            } catch (error: any) {
                              toast({
                                title: "Hata",
                                description: error.message || "Görsel yüklenemedi",
                                variant: "destructive",
                              });
                            } finally {
                              setUploadingImage(false);
                              if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
                            }
                          }}
                          className="hidden"
                          id="galleryImageUpload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => galleryFileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {uploadingImage ? "Yükleniyor..." : "Görsel Ekle"}
                        </Button>
                      </div>
                    </div>

                    {productImages.length === 0 ? (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">Henüz görsel eklenmemiş</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Görsel arama özelliğinden birden fazla görsel seçtiğinizde, ana görsel dışındakiler buraya eklenecektir.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {productImages.map((img) => (
                          <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                            <img
                              src={img.imageUrl}
                              alt={img.alt || "Ürün görseli"}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setProductImages((prev) => prev.filter((i) => i.id !== img.id));
                                  toast({ title: "Başarılı", description: "Görsel kaldırıldı" });
                                }}
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

