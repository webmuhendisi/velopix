import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export default function AdminCategoryNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    parentId: "",
    order: 0,
  });

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
      // Tüm kategorileri al (düz liste)
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Kategoriler yüklenemedi:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        icon: formData.icon || null,
        parentId: formData.parentId && formData.parentId !== "__none__" ? formData.parentId : null,
        order: formData.order || 0,
      };
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Kategori oluşturulamadı");
      }

      const newCategory = await res.json();
      toast({ 
        title: "Başarılı", 
        description: newCategory.parentId 
          ? `Alt kategori "${newCategory.name}" başarıyla oluşturuldu` 
          : `Ana kategori "${newCategory.name}" başarıyla oluşturuldu`
      });
      // Kısa bir gecikme sonrası yönlendir (toast görünsün)
      setTimeout(() => {
        setLocation("/admin/categories");
      }, 500);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kategori oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Yeni Kategori</h1>
            <p className="text-muted-foreground">Yeni bir kategori oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Kategori Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Kategori Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name
                      .toLowerCase()
                      .replace(/ğ/g, "g")
                      .replace(/ü/g, "u")
                      .replace(/ş/g, "s")
                      .replace(/ı/g, "i")
                      .replace(/ö/g, "o")
                      .replace(/ç/g, "c")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setFormData({ ...formData, name, slug });
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="parentId">Üst Kategori</Label>
                <Select
                  value={formData.parentId || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ana kategori (üst kategori yok)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="__none__">📁 Ana kategori (üst kategori yok)</SelectItem>
                    {categories
                      .filter((cat) => !cat.parentId)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.parentId && formData.parentId !== "__none__" ? (
                    <>
                      Bu kategori, <strong>{categories.find(c => c.id === formData.parentId)?.name || "seçilen kategori"}</strong> altında bir alt kategori olarak eklenecek.
                    </>
                  ) : (
                    "Bu kategoriyi bir alt kategori yapmak için üst kategori seçin"
                  )}
                </p>
              </div>
              <div>
                <Label htmlFor="order">Sıra</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Kategorilerin listelenme sırası (düşük sayı önce gösterilir)
                </p>
              </div>
              <IconSelect
                value={formData.icon}
                onChange={(value) => setFormData({ ...formData, icon: value })}
                label="İkon"
                placeholder="İkon seçin"
              />
              <div className="flex gap-2">
                <Link href="/admin/categories" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    İptal
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}

