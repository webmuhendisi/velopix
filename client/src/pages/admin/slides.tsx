import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string | null;
  link: string | null;
  order: number;
  active: boolean;
}

export default function AdminSlides() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    image: "",
    title: "",
    subtitle: "",
    link: "",
    order: 0,
    active: true,
  });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchData();
  }, [token, setLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/slides", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSlides(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subtitle: formData.subtitle || null,
        link: formData.link || null,
        order: parseInt(formData.order.toString()) || 0,
      };

      if (editingSlide) {
        await fetch(`/api/admin/slides/${editingSlide.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        toast({ title: "Başarılı", description: "Slide güncellendi" });
      } else {
        await fetch("/api/admin/slides", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        toast({ title: "Başarılı", description: "Slide eklendi" });
      }
      setIsDialogOpen(false);
      setEditingSlide(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem başarısız",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    setFormData({
      image: slide.image,
      title: slide.title,
      subtitle: slide.subtitle || "",
      link: slide.link || "",
      order: slide.order,
      active: slide.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu slide'ı silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/slides/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Slide silindi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  const handleOrderChange = async (id: string, direction: "up" | "down") => {
    const slide = slides.find((s) => s.id === id);
    if (!slide) return;

    const currentIndex = slides.findIndex((s) => s.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === slides.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetSlide = slides[targetIndex];

    try {
      await Promise.all([
        fetch(`/api/admin/slides/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: targetSlide.order }),
        }),
        fetch(`/api/admin/slides/${targetSlide.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: slide.order }),
        }),
      ]);
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sıralama güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      image: "",
      title: "",
      subtitle: "",
      link: "",
      order: slides.length,
      active: true,
    });
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
      setFormData((prev) => ({ ...prev, image: data.url }));
      toast({
        title: "Başarılı",
        description: "Görsel yüklendi",
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
            <h1 className="text-3xl font-bold">Slider Yönetimi</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Slider Yönetimi</h1>
            <p className="text-muted-foreground">Ana sayfa slider'ını yönetin</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  setEditingSlide(null);
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSlide ? "Slide Düzenle" : "Yeni Slide Ekle"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="image">Slide Görseli *</Label>
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
                          alt="Slide görseli"
                          className="max-w-full h-48 object-cover rounded-lg border"
                        />
                        <p className="text-sm text-muted-foreground mt-1">{formData.image}</p>
                      </div>
                    )}
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      required
                      placeholder="Veya görsel URL'si girin..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Başlık *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Alt Başlık</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="link">Link URL</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/products"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order">Sıra</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor="active">Aktif</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                    {editingSlide ? "Güncelle" : "Ekle"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide, index) => (
            <Card key={slide.id}>
              <CardContent className="p-0">
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/800x450?text=Image+Not+Found";
                    }}
                  />
                  {!slide.active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold">Pasif</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{slide.title}</h3>
                  {slide.subtitle && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">Sıra: {slide.order}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrderChange(slide.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrderChange(slide.id, "down")}
                      disabled={index === slides.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slide)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slide.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

