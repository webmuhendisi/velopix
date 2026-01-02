import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ShippingRegion {
  id: string;
  name: string;
  cities: string | null;
  cost: string;
  order: number | null;
}

export default function AdminShippingRegions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [regions, setRegions] = useState<ShippingRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cities: "",
    cost: "",
    order: "0",
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
      const res = await fetch("/api/admin/shipping-regions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRegions(data);
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
      const citiesArray = formData.cities
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const payload = {
        name: formData.name,
        cities: citiesArray,
        cost: parseFloat(formData.cost),
        order: parseInt(formData.order) || 0,
      };

      if (editingId) {
        await fetch(`/api/admin/shipping-regions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        toast({ title: "Başarılı", description: "Bölge güncellendi" });
      } else {
        await fetch("/api/admin/shipping-regions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        toast({ title: "Başarılı", description: "Bölge eklendi" });
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", cities: "", cost: "", order: "0" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "İşlem başarısız",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (region: ShippingRegion) => {
    setEditingId(region.id);
    let citiesStr = "";
    if (region.cities) {
      try {
        const cities = JSON.parse(region.cities);
        citiesStr = Array.isArray(cities) ? cities.join(", ") : region.cities;
      } catch {
        citiesStr = region.cities;
      }
    }
    setFormData({
      name: region.name,
      cities: citiesStr,
      cost: region.cost,
      order: region.order?.toString() || "0",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu bölgeyi silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/admin/shipping-regions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Bölge silindi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Kargo Bölgeleri</h1>
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
            <h1 className="text-3xl font-bold">Kargo Bölgeleri</h1>
            <p className="text-muted-foreground">Bölgelere göre kargo ücretlerini yönetin</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: "", cities: "", cost: "", order: "0" });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "İptal" : "Yeni Bölge"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Bölge Düzenle" : "Yeni Bölge"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Bölge Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Örn: İstanbul, Ankara"
                  />
                </div>
                <div>
                  <Label htmlFor="cities">Şehirler *</Label>
                  <Input
                    id="cities"
                    value={formData.cities}
                    onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
                    required
                    placeholder="Virgülle ayırın: İstanbul, Kadıköy, Beşiktaş"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Şehirleri virgülle ayırarak girin
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">Kargo Ücreti (₺) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order">Sıra</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingId ? "Güncelle" : "Ekle"}</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ name: "", cities: "", cost: "", order: "0" });
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bölge Adı</TableHead>
                  <TableHead>Şehirler</TableHead>
                  <TableHead className="text-right">Kargo Ücreti</TableHead>
                  <TableHead className="text-center">Sıra</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Henüz bölge eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  regions.map((region) => {
                    let citiesDisplay = "";
                    if (region.cities) {
                      try {
                        const cities = JSON.parse(region.cities);
                        citiesDisplay = Array.isArray(cities) ? cities.join(", ") : region.cities;
                      } catch {
                        citiesDisplay = region.cities;
                      }
                    }
                    return (
                      <TableRow key={region.id}>
                        <TableCell className="font-semibold">{region.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {citiesDisplay || "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {parseFloat(region.cost).toFixed(2)} ₺
                        </TableCell>
                        <TableCell className="text-center">{region.order || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(region)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(region.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

