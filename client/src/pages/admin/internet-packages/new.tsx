import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminInternetPackageNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    speed: "",
    price: "",
    provider: "",
    features: "",
    highlighted: false,
  });

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
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        name: formData.name,
        speed: parseInt(formData.speed),
        price: parseFloat(formData.price),
        provider: formData.provider,
        features: JSON.stringify(featuresArray),
        highlighted: formData.highlighted,
      };

      const res = await fetch("/api/admin/internet-packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Paket oluşturulamadı");
      }

      toast({ title: "Başarılı", description: "Paket oluşturuldu" });
      setLocation("/admin/internet-packages");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Paket oluşturulamadı",
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
          <Link href="/admin/internet-packages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Yeni Internet Paketi</h1>
            <p className="text-muted-foreground">Yeni bir internet paketi oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Paket Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Paket Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Sağlayıcı *</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="speed">Hız (Mbps) *</Label>
                  <Input
                    id="speed"
                    type="number"
                    value={formData.speed}
                    onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Fiyat (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="features">Özellikler (Her satıra bir özellik)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={5}
                  placeholder="50 Mbps hız&#10;Sınırsız veri&#10;24/7 destek"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="highlighted"
                  checked={formData.highlighted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, highlighted: checked })
                  }
                />
                <Label htmlFor="highlighted">Öne Çıkarılmış</Label>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/internet-packages" className="flex-1">
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

