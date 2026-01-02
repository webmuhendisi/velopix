import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RepairService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export default function AdminRepairServices() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [services, setServices] = useState<RepairService[]>([]);
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
      const res = await fetch("/api/admin/repair-services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setLocation("/admin/login");
          return;
        }
        const error = await res.json();
        throw new Error(error.error || "Veriler yüklenemedi");
      }
      
      const data = await res.json();
      // Ensure data is an array
      setServices(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Veriler yüklenemedi",
        variant: "destructive",
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu servisi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/repair-services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Servis silindi" });
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
            <h1 className="text-3xl font-bold">Tamir Servisleri</h1>
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
            <h1 className="text-3xl font-bold">Tamir Servisleri</h1>
            <p className="text-muted-foreground">Tamir servislerini yönetin</p>
          </div>
          <Link href="/admin/repair-services/new">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Servis
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Henüz servis bulunmuyor</p>
                <Link href="/admin/repair-services/new">
                  <Button>İlk Servisi Oluştur</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  )}
                  {service.icon && (
                    <p className="text-xs text-muted-foreground mb-4">Icon: {service.icon}</p>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/admin/repair-services/${service.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Düzenle
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
