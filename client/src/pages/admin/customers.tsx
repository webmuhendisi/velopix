import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Mail, Calendar, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  phone: string;
  name: string;
  email: string | null;
  totalRepairs: number;
  lastRepairDate: string | null;
}

export default function AdminCustomers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setLocation("/admin/login");
          return;
        }
        
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          throw new Error(error.error || "Veriler yüklenemedi");
        } else {
          // If not JSON, it's probably an HTML error page
          const text = await res.text();
          console.error("Non-JSON response:", text.substring(0, 200));
          throw new Error(`Server hatası: ${res.status} ${res.statusText}`);
        }
      }
      
      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", text.substring(0, 200));
        throw new Error("Sunucu JSON yerine HTML döndürdü");
      }
      
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);
      toast({
        title: "Hata",
        description: error.message || "Müşteriler yüklenemedi",
        variant: "destructive",
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Müşteriler</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground">Müşteri bilgilerini ve tamir geçmişlerini görüntüleyin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Müşterileri Ara</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="İsim, telefon veya e-posta ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? "Arama sonucu bulunamadı" : "Henüz müşteri bulunmuyor"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.phone}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{customer.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{customer.phone}</span>
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="font-semibold">{customer.totalRepairs}</span> tamir kaydı
                          </span>
                        </div>
                        {customer.lastRepairDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Son tamir: {new Date(customer.lastRepairDate).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/admin/customers/${encodeURIComponent(customer.phone)}`}>
                        <Button variant="outline">
                          Detayları Gör
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredCustomers.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Toplam {filteredCustomers.length} müşteri bulundu
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

