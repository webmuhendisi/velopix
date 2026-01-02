import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, ExternalLink, Wifi, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  productId: string | null;
  internetPackageId: string | null;
  quantity: number;
  price: string;
  product?: {
    id: string;
    title: string;
    slug?: string;
    image: string | null;
  } | null;
  internetPackage?: {
    id: string;
    name: string;
    provider: string;
    speed: number;
  } | null;
}

interface Order {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  total: string;
  shippingCost?: string | null;
  paymentMethod?: string | null;
  status: string;
  whatsappSent: boolean;
  createdAt: string;
  items?: OrderItem[];
}

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Siparişler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: "Başarılı", description: "Sipariş durumu güncellendi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Durum güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "processing":
        return "İşleniyor";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const generateWhatsAppLink = (order: Order) => {
    const itemsText = order.items
      ?.map((item) => {
        if (item.product) {
          return `${item.product.title} x${item.quantity}`;
        } else if (item.internetPackage) {
          return `${item.internetPackage.name} (${item.internetPackage.provider}) x${item.quantity}`;
        }
        return `Ürün x${item.quantity}`;
      })
      .join("\n") || "";

    const message = `Sipariş Detayları:\n\nMüşteri: ${order.customerName}\nTelefon: ${order.customerPhone}\n\nÜrünler:\n${itemsText}\n\nAdres: ${order.address}${order.city ? `, ${order.city}` : ""}${order.district ? `, ${order.district}` : ""}\n\nToplam: ${order.total}₺`;

    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "905338332111";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const getProductLink = (item: OrderItem) => {
    if (item.product?.slug) {
      return `/products/${item.product.slug}`;
    } else if (item.product?.id) {
      return `/products/${item.product.id}`;
    }
    return null;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Siparişler</h1>
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
          <h1 className="text-3xl font-bold">Siparişler</h1>
          <p className="text-muted-foreground">Tüm siparişleri görüntüleyin ve yönetin</p>
        </div>

        {orders.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Henüz sipariş bulunmuyor</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Sipariş No</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Ürünler</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.orderNumber || order.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatShortDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      {order.city && (
                        <div className="text-xs text-muted-foreground">{order.city}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {order.customerPhone}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="flex items-center gap-1">
                                {item.product ? (
                                  <Package className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <Wifi className="w-3 h-3 text-muted-foreground" />
                                )}
                                <span className="text-xs">
                                  {item.product?.title || item.internetPackage?.name || "Ürün"} x{item.quantity}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{order.items.length - 2} ürün daha
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {parseFloat(order.total).toFixed(2)}₺
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Beklemede</SelectItem>
                            <SelectItem value="processing">İşleniyor</SelectItem>
                            <SelectItem value="completed">Tamamlandı</SelectItem>
                            <SelectItem value="cancelled">İptal Edildi</SelectItem>
                          </SelectContent>
                        </Select>
                        <Dialog
                          open={isDialogOpen && selectedOrder?.id === order.id}
                          onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setSelectedOrder(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detay
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                Sipariş Detayları
                                {order.orderNumber && (
                                  <span className="text-sm font-mono text-muted-foreground">
                                    ({order.orderNumber})
                                  </span>
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Müşteri Bilgileri */}
                                <div>
                                  <h3 className="font-semibold mb-3 text-lg">Müşteri Bilgileri</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Ad Soyad:</span>
                                      <p className="font-medium">{selectedOrder.customerName}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Telefon:</span>
                                      <p className="font-medium">
                                        <a
                                          href={`tel:${selectedOrder.customerPhone}`}
                                          className="text-primary hover:underline"
                                        >
                                          {selectedOrder.customerPhone}
                                        </a>
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Adres Bilgileri */}
                                <div>
                                  <h3 className="font-semibold mb-3 text-lg">Adres Bilgileri</h3>
                                  <div className="space-y-2 text-sm">
                                    <p className="font-medium">{selectedOrder.address}</p>
                                    <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                                      {selectedOrder.city && (
                                        <div>
                                          <span className="font-medium">Şehir:</span> {selectedOrder.city}
                                        </div>
                                      )}
                                      {selectedOrder.district && (
                                        <div>
                                          <span className="font-medium">İlçe:</span> {selectedOrder.district}
                                        </div>
                                      )}
                                      {selectedOrder.postalCode && (
                                        <div>
                                          <span className="font-medium">Posta Kodu:</span> {selectedOrder.postalCode}
                                        </div>
                                      )}
                                    </div>
                                    {selectedOrder.latitude && selectedOrder.longitude && (
                                      <a
                                        href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                                      >
                                        Haritada Gör <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Ürünler */}
                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-3 text-lg">Ürünler</h3>
                                    <div className="space-y-3">
                                      {selectedOrder.items.map((item) => {
                                        const productLink = getProductLink(item);
                                        return (
                                          <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                                          >
                                            {item.product?.image ? (
                                              <img
                                                src={item.product.image}
                                                alt={item.product.title || "Ürün"}
                                                className="w-16 h-16 object-cover rounded"
                                              />
                                            ) : item.internetPackage ? (
                                              <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                                                <Wifi className="w-8 h-8 text-primary" />
                                              </div>
                                            ) : (
                                              <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                                                <Package className="w-8 h-8 text-muted-foreground" />
                                              </div>
                                            )}
                                            <div className="flex-1">
                                              {item.product ? (
                                                productLink ? (
                                                  <Link href={productLink} className="font-medium hover:text-primary hover:underline">
                                                    {item.product.title}
                                                  </Link>
                                                ) : (
                                                  <p className="font-medium">{item.product.title}</p>
                                                )
                                              ) : item.internetPackage ? (
                                                <div>
                                                  <p className="font-medium">{item.internetPackage.name}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {item.internetPackage.provider} - {item.internetPackage.speed} Mbps
                                                  </p>
                                                </div>
                                              ) : (
                                                <p className="font-medium">Ürün</p>
                                              )}
                                              <p className="text-sm text-muted-foreground mt-1">
                                                Adet: {item.quantity} × {parseFloat(item.price).toFixed(2)}₺
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-bold text-lg">
                                                {(parseFloat(item.price) * item.quantity).toFixed(2)}₺
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Notlar */}
                                {selectedOrder.notes && (
                                  <div>
                                    <h3 className="font-semibold mb-2 text-lg">Notlar</h3>
                                    <p className="text-sm bg-secondary p-3 rounded-lg">{selectedOrder.notes}</p>
                                  </div>
                                )}

                                {/* Özet */}
                                <div className="border-t pt-4 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ara Toplam:</span>
                                    <span className="font-medium">
                                      {(parseFloat(selectedOrder.total) - (parseFloat(selectedOrder.shippingCost || "0"))).toFixed(2)}₺
                                    </span>
                                  </div>
                                  {selectedOrder.shippingCost && parseFloat(selectedOrder.shippingCost) > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Kargo:</span>
                                      <span className="font-medium">{parseFloat(selectedOrder.shippingCost).toFixed(2)}₺</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Toplam:</span>
                                    <span>{parseFloat(selectedOrder.total).toFixed(2)}₺</span>
                                  </div>
                                </div>

                                {/* İşlemler */}
                                <div className="flex justify-between items-center pt-4 border-t">
                                  <div className="text-sm text-muted-foreground">
                                    Sipariş Tarihi: {formatDate(selectedOrder.createdAt)}
                                  </div>
                                  <a
                                    href={generateWhatsAppLink(selectedOrder)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline">
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      WhatsApp'ta Aç
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
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
