import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, CheckCircle, XCircle, Clock, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";

interface RepairRequest {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  problemDescription: string;
  status: string;
  estimatedPrice: string | null;
  finalPrice: string | null;
  laborCost: string | null;
  partsCost: string | null;
  customerApproved: boolean | null;
  diagnosisNotes: string | null;
  repairNotes: string | null;
  repairItems: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  images?: Array<{ id: string; imageUrl: string; description: string | null }>;
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Beklemede", color: "bg-gray-500", icon: Clock },
  diagnosis: { label: "Tanı Aşamasında", color: "bg-blue-500", icon: Clock },
  price_quoted: { label: "Fiyat Teklifi Verildi", color: "bg-yellow-500", icon: Clock },
  customer_approved: { label: "Müşteri Onayladı", color: "bg-green-500", icon: CheckCircle },
  customer_rejected: { label: "Müşteri Reddetti", color: "bg-red-500", icon: XCircle },
  in_repair: { label: "Tamirde", color: "bg-purple-500", icon: Wrench },
  completed: { label: "Tamamlandı", color: "bg-green-600", icon: CheckCircle },
  delivered: { label: "Teslim Edildi", color: "bg-green-700", icon: CheckCircle },
};

export default function RepairTrack() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useSEO({
    title: "Tamir Takip - VeloPix",
    description: "Tamir durumunuzu takip numaranız ile sorgulayın.",
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen takip numarası girin",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/repair-requests/track/${trackingNumber}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Bu takip numarasına ait kayıt bulunamadı");
        }
        throw new Error("Kayıt bulunamadı");
      }
      const data = await res.json();
      setRequest(data);
      setSearched(true);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kayıt bulunamadı",
        variant: "destructive",
      });
      setRequest(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!request) return;

    try {
      const res = await fetch(`/api/repair-requests/${request.trackingNumber}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      });

      if (!res.ok) throw new Error("Onay durumu güncellenemedi");

      const updated = await res.json();
      setRequest(updated);
      toast({
        title: approved ? "Onaylandı" : "Reddedildi",
        description: approved
          ? "Fiyat teklifini onayladınız. Tamir işlemi başlayacak."
          : "Fiyat teklifini reddettiniz.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Onay durumu güncellenemedi",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/repair">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tamir Durumu Takip</CardTitle>
            <p className="text-muted-foreground">
              Takip numaranızı girerek tamir durumunuzu öğrenebilirsiniz.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="trackingNumber">Takip Numarası</Label>
                <div className="flex gap-2">
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                    placeholder="TRXXXXX"
                    className="font-mono"
                  />
                  <Button type="submit" disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Aranıyor..." : "Sorgula"}
                  </Button>
                </div>
              </div>
            </form>

            {searched && !request && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Bu takip numarasına ait kayıt bulunamadı. Lütfen takip numaranızı kontrol edin.
                </p>
              </div>
            )}

            {request && (
              <div className="space-y-6">
                <div className="bg-secondary rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Takip Numarası</p>
                      <p className="text-2xl font-bold font-mono">{request.trackingNumber}</p>
                    </div>
                    <Badge
                      className={`${statusLabels[request.status]?.color || "bg-gray-500"} text-white`}
                    >
                      {statusLabels[request.status]?.label || request.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Müşteri</p>
                      <p className="font-semibold">{request.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cihaz</p>
                      <p className="font-semibold">
                        {request.deviceBrand} {request.deviceModel}
                      </p>
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
                </div>

                {request.status === "price_quoted" && request.finalPrice && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Fiyat Teklifi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Teklif Edilen Fiyat</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {parseFloat(request.finalPrice).toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                      {request.diagnosisNotes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tanı Notları</p>
                          <p className="text-sm whitespace-pre-wrap">{request.diagnosisNotes}</p>
                        </div>
                      )}
                      {request.customerApproved === null && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(true)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Onayla
                          </Button>
                          <Button
                            onClick={() => handleApprove(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reddet
                          </Button>
                        </div>
                      )}
                      {request.customerApproved === true && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Fiyat teklifi onaylandı
                        </Badge>
                      )}
                      {request.customerApproved === false && (
                        <Badge className="bg-red-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Fiyat teklifi reddedildi
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )}

                {request.repairNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tamir Notları</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{request.repairNotes}</p>
                    </CardContent>
                  </Card>
                )}

                {request.completedAt && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <p className="font-semibold">
                          Tamir işlemi {new Date(request.completedAt).toLocaleDateString("tr-TR")}{" "}
                          tarihinde tamamlandı.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {request.deliveredAt && (
                  <Card className="border-green-300 bg-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <p className="font-semibold">
                          Cihazınız {new Date(request.deliveredAt).toLocaleDateString("tr-TR")}{" "}
                          tarihinde teslim edildi.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {request.repairItems && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Yapılacak İşlemler ve Değişecek Parçalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const items = JSON.parse(request.repairItems);
                            return items.map((item: any, index: number) => (
                              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                                <Badge className={item.type === "labor" ? "bg-blue-500" : "bg-green-500"}>
                                  {item.type === "labor" ? "İşlem" : "Parça"}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-semibold">{item.description}</p>
                                  {item.price && (
                                    <p className="text-sm text-muted-foreground">
                                      {parseFloat(item.price).toLocaleString("tr-TR")} ₺
                                    </p>
                                  )}
                                </div>
                              </div>
                            ));
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {request.images && request.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cihaz Fotoğrafları</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {request.images.map((image) => (
                          <div key={image.id}>
                            <img
                              src={image.imageUrl}
                              alt={image.description || "Cihaz fotoğrafı"}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            {image.description && (
                              <p className="text-xs text-muted-foreground mt-1">{image.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

