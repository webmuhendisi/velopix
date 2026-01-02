import { useState, useEffect } from "react";
import { useLocation, Link, useRoute } from "wouter";
import AdminLayout from "../../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RepairService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export default function AdminRepairServiceEdit() {
  const [, params] = useRoute("/admin/repair-services/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });

  const token = localStorage.getItem("adminToken");
  const serviceId = params?.id;

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    if (serviceId) {
      fetchService();
    }
  }, [token, serviceId, setLocation]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/repair-services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Servis bulunamadı");
      }
      const service: RepairService = await res.json();
      setFormData({
        name: service.name,
        description: service.description || "",
        icon: service.icon || "",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Servis yüklenemedi",
        variant: "destructive",
      });
      setLocation("/admin/repair-services");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
      };

      const res = await fetch(`/api/admin/repair-services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Servis güncellenemedi");
      }

      toast({ title: "Başarılı", description: "Servis güncellendi" });
      setLocation("/admin/repair-services");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Servis güncellenemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Servis Düzenle</h1>
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
          <Link href="/admin/repair-services">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Servis Düzenle</h1>
            <p className="text-muted-foreground">Servis bilgilerini düzenleyin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Servis Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Servis Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <IconSelect
                value={formData.icon}
                onChange={(value) => setFormData({ ...formData, icon: value })}
                label="İkon"
                placeholder="İkon seçin"
              />
              <div className="flex gap-2">
                <Link href="/admin/repair-services" className="flex-1">
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

