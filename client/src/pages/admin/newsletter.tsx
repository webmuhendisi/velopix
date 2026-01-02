import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewsletterSubscription {
  id: string;
  email: string | null;
  phone: string | null;
  status: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export default function AdminNewsletter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
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
      const res = await fetch("/api/admin/newsletter", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const data = await res.json();
      setSubscriptions(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Abonelikler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu aboneliği silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Abonelik silinemedi");

      toast({ title: "Başarılı", description: "Abonelik silindi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Abonelik silinemedi",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">E-Bülten Aboneleri</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const unsubscribed = subscriptions.filter((s) => s.status === "unsubscribed");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">E-Bülten Aboneleri</h1>
            <p className="text-muted-foreground">
              Toplam {subscriptions.length} abone ({activeSubscriptions.length} aktif, {unsubscribed.length} iptal)
            </p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Henüz abone bulunmuyor</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta / Telefon</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Abone Olma Tarihi</TableHead>
                  <TableHead>İptal Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {sub.email ? (
                          <>
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{sub.email}</span>
                          </>
                        ) : null}
                        {sub.phone ? (
                          <>
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{sub.phone}</span>
                          </>
                        ) : null}
                        {!sub.email && !sub.phone && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.status === "active" ? (
                        <Badge className="bg-green-500">Aktif</Badge>
                      ) : (
                        <Badge variant="outline">İptal Edildi</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(sub.subscribedAt)}</TableCell>
                    <TableCell>{sub.unsubscribedAt ? formatDate(sub.unsubscribedAt) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(sub.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Sil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

