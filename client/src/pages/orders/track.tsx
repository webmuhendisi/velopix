import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Package, Calendar, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "905338332111";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product?: {
    id: string;
    title: string;
    image: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string | null;
  district: string | null;
  total: string;
  shippingCost: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderTrack() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!phone.trim()) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen telefon numaranızı girin.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/track/${encodeURIComponent(phone)}`);
      if (!response.ok) {
        throw new Error("Siparişler bulunamadı");
      }
      const data = await response.json();
      setOrders(data);
      if (data.length === 0) {
        toast({
          title: "Sipariş bulunamadı",
          description: "Bu telefon numarası ile kayıtlı sipariş bulunamadı.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Siparişler yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Beklemede", variant: "outline" },
      confirmed: { label: "Onaylandı", variant: "default" },
      preparing: { label: "Hazırlanıyor", variant: "default" },
      shipped: { label: "Kargoda", variant: "default" },
      delivered: { label: "Teslim Edildi", variant: "default" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openWhatsApp = (order: Order) => {
    const message = `Merhaba, ${order.orderNumber} numaralı siparişim hakkında bilgi almak istiyorum.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-heading mb-4">Sipariş Takibi</h1>
            <p className="text-muted-foreground">
              Telefon numaranız ile siparişlerinizi sorgulayabilirsiniz
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="5XX XXX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading} className="h-10">
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Aranıyor..." : "Sorgula"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Sipariş #{order.orderNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div>
                          <h3 className="font-semibold mb-2">Ürünler</h3>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                                <div className="flex items-center gap-3">
                                  {item.product?.image && (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.title}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.product?.title || "Ürün"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Adet: {item.quantity} × ${parseFloat(item.price).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-bold">
                                  ${(parseFloat(item.price) * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-secondary p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span>Ara Toplam</span>
                            <span>${(parseFloat(order.total) - parseFloat(order.shippingCost || "0")).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span>Kargo</span>
                            <span>
                              {parseFloat(order.shippingCost || "0") === 0
                                ? "Ücretsiz"
                                : `$${parseFloat(order.shippingCost || "0").toFixed(2)}`}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Toplam</span>
                            <span>${parseFloat(order.total).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Teslimat Adresi
                          </h3>
                          <p className="text-muted-foreground">
                            {order.address}
                            {order.district && `, ${order.district}`}
                            {order.city && `, ${order.city}`}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => openWhatsApp(order)}
                            className="flex-1"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp ile İletişim
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {orders.length === 0 && !loading && phone && (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Sipariş bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  Bu telefon numarası ile kayıtlı sipariş bulunamadı.
                </p>
                <Link href="/">
                  <Button variant="outline">Ana Sayfaya Dön</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

