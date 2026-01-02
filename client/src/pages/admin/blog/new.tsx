import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function AdminBlogNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    author: "velopix",
    published: false,
    publishedAt: "",
    modifiedAt: "",
    readingTime: null as number | null,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
  });

  // Calculate word count and reading time
  const calculateWordCount = (content: string): number => {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  const calculateReadingTime = (content: string): number => {
    const wordCount = calculateWordCount(content);
    return Math.ceil(wordCount / 200); // 200 words per minute
  };

  const wordCount = calculateWordCount(formData.content);
  const readingTime = calculateReadingTime(formData.content);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
  }, [token, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        excerpt: formData.excerpt || null,
        featuredImage: formData.featuredImage || null,
        author: formData.author || null,
        published: formData.published,
        publishedAt: formData.published && formData.publishedAt ? formData.publishedAt : null,
        modifiedAt: formData.modifiedAt || null,
        readingTime: readingTime > 0 ? readingTime : null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        metaKeywords: formData.metaKeywords || null,
        ogImage: formData.ogImage || null,
      };

      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Blog yazısı oluşturulamadı");
      }

      const post = await res.json();
      toast({ title: "Başarılı", description: "Blog yazısı oluşturuldu" });
      setLocation(`/admin/blog/${post.id}/edit`);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Blog yazısı oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Turkish character mapping for slug generation
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

  const generateSlug = (title: string) => {
    if (!title) return "";
    
    let slug = title
      .split("")
      .map((char) => turkishCharMap[char] || char)
      .join("")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
    
    return slug;
  };

  // Generate meta description from content (strip HTML and get first 150-160 characters)
  const generateMetaDescription = (content: string, excerpt?: string): string => {
    if (excerpt && excerpt.trim()) {
      return excerpt.trim().substring(0, 160);
    }
    
    if (!content) return "";
    
    // Strip HTML tags
    const textContent = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    return textContent.substring(0, 160);
  };

  // Generate keywords from title and content
  const generateKeywords = (title: string, content: string): string => {
    if (!title && !content) return "";
    
    // Combine title and content
    const text = `${title} ${content}`
      .replace(/<[^>]*>/g, " ") // Strip HTML
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();
    
    // Common Turkish stop words to exclude
    const stopWords = new Set([
      "ve", "ile", "bir", "bu", "şu", "o", "için", "gibi", "kadar", "daha",
      "en", "çok", "az", "var", "yok", "olan", "olarak", "ki", "de", "da",
      "mi", "mı", "mu", "mü", "ne", "nasıl", "neden", "nerede", "ne zaman",
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
      "been", "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "should", "could", "may", "might", "must", "can", "cannot",
    ]);
    
    // Extract words (Turkish and English)
    const words = text
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .filter((word) => /^[a-zğüşıöç]+$/i.test(word)); // Only letters
    
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Get top 10 most frequent words
    const keywords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    return keywords.join(", ");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    // Check file type
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
        featuredImage: data.url,
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
          <Link href="/admin/blog">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Yeni Blog Yazısı</h1>
            <p className="text-muted-foreground">Yeni bir blog yazısı oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>İçerik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData((prev) => {
                          const newSlug = generateSlug(title);
                          const newMetaTitle = title || "";
                          const newMetaDescription = generateMetaDescription(prev.content, prev.excerpt);
                          const newKeywords = generateKeywords(title, prev.content);
                          
                          return {
                            ...prev,
                            title,
                            slug: newSlug,
                            metaTitle: newMetaTitle,
                            metaDescription: newMetaDescription || prev.metaDescription,
                            metaKeywords: newKeywords || prev.metaKeywords,
                          };
                        });
                      }}
                      required
                      placeholder="Blog yazısı başlığı"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      placeholder="blog-yazisi-slug"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Başlıktan otomatik oluşturulur. İsterseniz manuel olarak düzenleyebilirsiniz.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="excerpt">Özet</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => {
                        const excerpt = e.target.value;
                        setFormData((prev) => {
                          const newMetaDescription = generateMetaDescription(prev.content, excerpt);
                          return {
                            ...prev,
                            excerpt,
                            metaDescription: newMetaDescription || prev.metaDescription,
                          };
                        });
                      }}
                      rows={3}
                      placeholder="Kısa bir özet yazın..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Özet, meta açıklama için kullanılır. Boş bırakılırsa içerikten otomatik oluşturulur.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="content">İçerik *</Label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(value) => {
                        setFormData((prev) => {
                          const newMetaDescription = generateMetaDescription(value, prev.excerpt);
                          const newKeywords = generateKeywords(prev.title, value);
                          return {
                            ...prev,
                            content: value,
                            metaDescription: newMetaDescription || prev.metaDescription,
                            metaKeywords: newKeywords || prev.metaKeywords,
                          };
                        });
                      }}
                      placeholder="Blog yazısı içeriğini buraya yazın..."
                    />
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{wordCount.toLocaleString('tr-TR')} kelime</span>
                      <span>{readingTime} dakika okuma</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="featuredImage">Öne Çıkan Görsel</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="featuredImageUpload"
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
                        {formData.featuredImage && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormData({ ...formData, featuredImage: "" })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {formData.featuredImage && (
                        <div className="mt-2">
                          <img
                            src={formData.featuredImage}
                            alt="Öne çıkan görsel"
                            className="max-w-md h-48 object-cover rounded-lg border"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {formData.featuredImage}
                          </p>
                        </div>
                      )}
                      <Input
                        id="featuredImage"
                        value={formData.featuredImage}
                        onChange={(e) =>
                          setFormData({ ...formData, featuredImage: e.target.value })
                        }
                        placeholder="Veya görsel URL'si girin..."
                        className="mt-2"
                      />
                    </div>
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
                      placeholder={formData.title || "Meta başlık"}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Başlıktan otomatik oluşturulur. İsterseniz manuel olarak düzenleyebilirsiniz.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Açıklama</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, metaDescription: e.target.value })
                      }
                      rows={3}
                      placeholder="SEO için meta açıklama"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      İçerik veya özetten otomatik oluşturulur. İdeal uzunluk: 150-160 karakter.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="metaKeywords">Meta Anahtar Kelimeler</Label>
                    <Input
                      id="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={(e) =>
                        setFormData({ ...formData, metaKeywords: e.target.value })
                      }
                      placeholder="kelime1, kelime2, kelime3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Başlık ve içerikten otomatik oluşturulur. İsterseniz manuel olarak düzenleyebilirsiniz.
                    </p>
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
                      Boş bırakılırsa öne çıkan görsel kullanılır
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Yayın Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="author">Yazar</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Yazar adı"
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Varsayılan olarak "velopix" olarak ayarlanmıştır.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          published: checked,
                          publishedAt: checked && !formData.publishedAt
                            ? new Date().toISOString()
                            : formData.publishedAt,
                        })
                      }
                    />
                    <Label htmlFor="published">Yayınla</Label>
                  </div>
                  {formData.published && (
                    <div>
                      <Label htmlFor="publishedAt">Yayın Tarihi</Label>
                      <Input
                        id="publishedAt"
                        type="datetime-local"
                        value={
                          formData.publishedAt
                            ? new Date(formData.publishedAt).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            publishedAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                          })
                        }
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="modifiedAt">Son Güncelleme Tarihi</Label>
                    <Input
                      id="modifiedAt"
                      type="datetime-local"
                      value={
                        formData.modifiedAt
                          ? new Date(formData.modifiedAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modifiedAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      SEO için son güncelleme tarihi
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-semibold mb-2">İstatistikler</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Kelime Sayısı: {wordCount.toLocaleString('tr-TR')}</div>
                      <div>Okuma Süresi: {readingTime} dakika</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Link href="/admin/blog" className="flex-1">
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
      </div>
    </AdminLayout>
  );
}

