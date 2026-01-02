import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InternetPackage {
  id: string;
  name: string;
  speed: number;
  price: number;
  provider: string;
  features: string | null;
  highlighted: boolean;
}

export default function AdminInternetPackages() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = await fetch("/api/admin/internet-packages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPackages(data);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Bu paketi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/internet-packages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Paket silindi" });
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
            <h1 className="text-3xl font-bold">Internet Paketleri</h1>
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
            <h1 className="text-3xl font-bold">Internet Paketleri</h1>
            <p className="text-muted-foreground">Internet paketlerini yönetin</p>
          </div>
          <Link href="/admin/internet-packages/new">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Paket
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Henüz paket bulunmuyor</p>
                <Link href="/admin/internet-packages/new">
                  <Button>İlk Paketi Oluştur</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            packages.map((pkg) => {
              const features = pkg.features ? JSON.parse(pkg.features) : [];
              return (
                <Card key={pkg.id} className={pkg.highlighted ? "border-primary border-2" : ""}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{pkg.name}</h3>
                      {pkg.highlighted && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Öne Çıkan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{pkg.provider}</p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">{pkg.speed}</span>
                      <span className="text-sm text-muted-foreground">Mbps</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-bold">{pkg.price}₺</span>
                      <span className="text-sm text-muted-foreground">/ay</span>
                    </div>
                    {features.length > 0 && (
                      <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                        {features.slice(0, 3).map((feature: string, idx: number) => (
                          <li key={idx}>• {feature}</li>
                        ))}
                        {features.length > 3 && (
                          <li className="text-xs">+{features.length - 3} daha fazla</li>
                        )}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/admin/internet-packages/${pkg.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
