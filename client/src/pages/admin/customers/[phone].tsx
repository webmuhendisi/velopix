import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, Calendar, Wrench, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  phone: string;
  name: string;
  email: string | null;
  totalRepairs: number;
  lastRepairDate: string | null;
  repairRequests: RepairRequest[];
}

interface RepairRequest {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  deviceSerialNumber: string | null;
  problemDescription: string;
  repairServiceId: string | null;
  status: string;
  estimatedPrice: string | null;
  finalPrice: string | null;
  customerApproved: boolean | null;
  approvedAt: string | null;
  diagnosisNotes: string | null;
  repairNotes: string | null;
  repairItems: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "bg-gray-500" },
  diagnosis: { label: "Tanı Aşamasında", color: "bg-blue-500" },
  price_quoted: { label: "Fiyat Teklifi Verildi", color: "bg-yellow-500" },
  customer_approved: { label: "Müşteri Onayladı", color: "bg-green-500" },
  customer_rejected: { label: "Müşteri Reddetti", color: "bg-red-500" },
  in_repair: { label: "Tamirde", color: "bg-purple-500" },
  completed: { label: "Tamamlandı", color: "bg-green-600" },
  delivered: { label: "Teslim Edildi", color: "bg-green-700" },
};

export default function AdminCustomerDetail() {
  const [, params] = useRoute("/admin/customers/:phone");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("adminToken");
  const phone = params?.phone ? decodeURIComponent(params.phone) : "";

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    if (phone) {
      fetchData();
    }
  }, [token, phone, setLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setLocation("/admin/login");
          return;
        }
        if (res.status === 404) {
          toast({
            title: "Hata",
            description: "Müşteri bulunamadı",
            variant: "destructive",
          });
          setLocation("/admin/customers");
          return;
        }
        const error = await res.json();
        throw new Error(error.error || "Veriler yüklenemedi");
      }
      
      const data = await res.json();
      setCustomer(data);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Veriler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Müşteri Detayları</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Müşteri Bulunamadı</h1>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Müşteri Detayları</h1>
            <p className="text-muted-foreground">{customer.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{customer.name}</h3>
                <div className="flex items-center gap-6 mt-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Wrench className="w-4 h-4" />
                  <span>Toplam Tamir Kaydı</span>
                </div>
                <p className="text-2xl font-bold">{customer.totalRepairs}</p>
              </div>
              {customer.lastRepairDate && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Son Tamir Tarihi</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {new Date(customer.lastRepairDate).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tamir Geçmişi ({customer.repairRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.repairRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Henüz tamir kaydı bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.repairRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold">{request.trackingNumber}</h4>
                            <Badge className={statusLabels[request.status]?.color || "bg-gray-500"}>
                              {statusLabels[request.status]?.label || request.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Cihaz</p>
                              <p className="font-semibold">
                                {request.deviceBrand} {request.deviceModel}
                              </p>
                              <p className="text-muted-foreground text-xs">{request.deviceType}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Fiyat</p>
                              <p className="font-semibold">
                                {request.finalPrice
                                  ? `${parseFloat(request.finalPrice).toLocaleString("tr-TR")} ₺`
                                  : request.estimatedPrice
                                  ? `~${parseFloat(request.estimatedPrice).toLocaleString("tr-TR")} ₺`
                                  : "Belirtilmedi"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tarih</p>
                              <p className="font-semibold">
                                {new Date(request.createdAt).toLocaleDateString("tr-TR")}
                              </p>
                            </div>
                          </div>
                          {request.problemDescription && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-1">Sorun:</p>
                              <p className="text-sm line-clamp-2">{request.problemDescription}</p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Repair requests sayfasına git ve bu kaydı göster
                              window.location.href = `/admin/repair-requests?tracking=${request.trackingNumber}`;
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Görüntüle
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

