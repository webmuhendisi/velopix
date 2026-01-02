import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search, DollarSign, FileText, CheckCircle, XCircle, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminRepairRequests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [priceForm, setPriceForm] = useState({
    finalPrice: "",
    laborCost: "",
    partsCost: "",
    diagnosisNotes: "",
    repairItems: [] as Array<{ type: "labor" | "part"; description: string; price: string }>,
  });
  const [statusForm, setStatusForm] = useState({ status: "", repairNotes: "", repairItems: [] as Array<{ type: "labor" | "part"; description: string; price: string }> });
  const [repairRequestImages, setRepairRequestImages] = useState<Array<{ id: string; imageUrl: string; description: string | null }>>([]);

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
      const res = await fetch("/api/admin/repair-requests", {
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
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Veriler yüklenemedi",
        variant: "destructive",
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request: RepairRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
    // Fetch images
    try {
      const res = await fetch(`/api/admin/repair-requests/${request.id}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const images = await res.json();
        setRepairRequestImages(images);
      }
    } catch (error) {
      console.error("Failed to fetch images", error);
    }
  };

  const handleQuotePrice = (request: RepairRequest) => {
    setSelectedRequest(request);
    let repairItems: Array<{ type: "labor" | "part"; description: string; price: string }> = [];
    if (request.repairItems) {
      try {
        repairItems = JSON.parse(request.repairItems);
      } catch (e) {
        // If not JSON, ignore
      }
    }
    setPriceForm({
      finalPrice: request.finalPrice || "",
      laborCost: request.laborCost || "",
      partsCost: request.partsCost || "",
      diagnosisNotes: request.diagnosisNotes || "",
      repairItems,
    });
    setShowPriceDialog(true);
  };

  const handleSubmitPrice = async () => {
    if (!selectedRequest || !priceForm.finalPrice) {
      toast({
        title: "Hata",
        description: "Fiyat gerekli",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`/api/admin/repair-requests/${selectedRequest.id}/quote-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...priceForm,
          repairItems: priceForm.repairItems.length > 0 ? priceForm.repairItems : undefined,
        }),
      });
      if (!res.ok) throw new Error("Fiyat teklifi verilemedi");
      toast({ title: "Başarılı", description: "Fiyat teklifi verildi" });
      setShowPriceDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Fiyat teklifi verilemedi",
        variant: "destructive",
      });
    }
  };

  const addRepairItem = (type: "labor" | "part") => {
    setPriceForm({
      ...priceForm,
      repairItems: [...priceForm.repairItems, { type, description: "", price: "" }],
    });
  };

  const removeRepairItem = (index: number) => {
    setPriceForm({
      ...priceForm,
      repairItems: priceForm.repairItems.filter((_, i) => i !== index),
    });
  };

  const updateRepairItem = (index: number, field: "description" | "price", value: string) => {
    const newItems = [...priceForm.repairItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPriceForm({ ...priceForm, repairItems: newItems });
    
    // Calculate totals
    const laborTotal = newItems
      .filter((item) => item.type === "labor")
      .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const partsTotal = newItems
      .filter((item) => item.type === "part")
      .reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const total = laborTotal + partsTotal;
    
    setPriceForm({
      ...priceForm,
      repairItems: newItems,
      laborCost: laborTotal > 0 ? laborTotal.toString() : "",
      partsCost: partsTotal > 0 ? partsTotal.toString() : "",
      finalPrice: total > 0 ? total.toString() : priceForm.finalPrice,
    });
  };

  const handleUpdateStatus = (request: RepairRequest) => {
    setSelectedRequest(request);
    let repairItems: Array<{ type: "labor" | "part"; description: string; price: string }> = [];
    if (request.repairItems) {
      try {
        repairItems = JSON.parse(request.repairItems);
      } catch (e) {
        // If not JSON, ignore
      }
    }
    setStatusForm({
      status: request.status,
      repairNotes: request.repairNotes || "",
      repairItems,
    });
    setShowStatusDialog(true);
  };

  const handleSubmitStatus = async () => {
    if (!selectedRequest || !statusForm.status) {
      toast({
        title: "Hata",
        description: "Durum gerekli",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`/api/admin/repair-requests/${selectedRequest.id}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...statusForm,
          repairItems: statusForm.repairItems.length > 0 ? statusForm.repairItems : undefined,
        }),
      });
      if (!res.ok) throw new Error("Durum güncellenemedi");
      toast({ title: "Başarılı", description: "Durum güncellendi" });
      setShowStatusDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customerPhone.includes(searchTerm) ||
      req.deviceBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Tamir Kayıtları</h1>
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
            <h1 className="text-3xl font-bold">Tamir Kayıtları</h1>
            <p className="text-muted-foreground">Tamir taleplerini yönetin</p>
          </div>
          <Link href="/admin/repair-requests/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kayıt Ekle
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kayıtları Ara</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Takip no, müşteri adı, telefon, marka, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Henüz tamir kaydı bulunmuyor</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{request.trackingNumber}</h3>
                        <Badge className={statusLabels[request.status]?.color || "bg-gray-500"}>
                          {statusLabels[request.status]?.label || request.status}
                        </Badge>
                        {request.customerApproved === true && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Onaylandı
                          </Badge>
                        )}
                        {request.customerApproved === false && (
                          <Badge className="bg-red-500">
                            <XCircle className="w-3 h-3 mr-1" />
                            Reddedildi
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Müşteri</p>
                          <p className="font-semibold">{request.customerName}</p>
                          <p className="text-muted-foreground">{request.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cihaz</p>
                          <p className="font-semibold">
                            {request.deviceBrand} {request.deviceModel}
                          </p>
                          <p className="text-muted-foreground">{request.deviceType}</p>
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
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detay
                      </Button>
                      {request.status === "diagnosis" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuotePrice(request)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Fiyat Teklifi
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(request)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Durum Güncelle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tamir Kaydı Detayları</DialogTitle>
              <DialogDescription>
                Takip No: {selectedRequest?.trackingNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Müşteri Adı</Label>
                    <p className="font-semibold">{selectedRequest.customerName}</p>
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <p className="font-semibold">{selectedRequest.customerPhone}</p>
                  </div>
                  {selectedRequest.customerEmail && (
                    <div>
                      <Label>E-posta</Label>
                      <p className="font-semibold">{selectedRequest.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <Label>Durum</Label>
                    <Badge className={statusLabels[selectedRequest.status]?.color || "bg-gray-500"}>
                      {statusLabels[selectedRequest.status]?.label || selectedRequest.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Cihaz Tipi</Label>
                    <p className="font-semibold">{selectedRequest.deviceType}</p>
                  </div>
                  <div>
                    <Label>Marka</Label>
                    <p className="font-semibold">{selectedRequest.deviceBrand}</p>
                  </div>
                  <div>
                    <Label>Model</Label>
                    <p className="font-semibold">{selectedRequest.deviceModel}</p>
                  </div>
                  {selectedRequest.deviceSerialNumber && (
                    <div>
                      <Label>Seri No</Label>
                      <p className="font-semibold">{selectedRequest.deviceSerialNumber}</p>
                    </div>
                  )}
                  <div>
                    <Label>Fiyat</Label>
                    <p className="font-semibold">
                      {selectedRequest.finalPrice
                        ? `${parseFloat(selectedRequest.finalPrice).toLocaleString("tr-TR")} ₺`
                        : selectedRequest.estimatedPrice
                        ? `~${parseFloat(selectedRequest.estimatedPrice).toLocaleString("tr-TR")} ₺`
                        : "Belirtilmedi"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Sorun Açıklaması</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequest.problemDescription}
                  </p>
                </div>
                {selectedRequest.diagnosisNotes && (
                  <div>
                    <Label>Tanı Notları</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.diagnosisNotes}
                    </p>
                  </div>
                )}
                {selectedRequest.repairNotes && (
                  <div>
                    <Label>Tamir Notları</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.repairNotes}
                    </p>
                  </div>
                )}
                {selectedRequest.repairItems && (
                  <div>
                    <Label>Yapılacak İşlemler ve Değişecek Parçalar</Label>
                    <div className="space-y-2 mt-2">
                      {(() => {
                        try {
                          const items = JSON.parse(selectedRequest.repairItems);
                          return items.map((item: any, index: number) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-start gap-2">
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
                            </Card>
                          ));
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                )}
                {repairRequestImages.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Cihaz Fotoğrafları ({repairRequestImages.length})
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {repairRequestImages.map((image) => (
                        <div key={image.id} className="relative">
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
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Oluşturulma: {new Date(selectedRequest.createdAt).toLocaleString("tr-TR")}</p>
                  <p>Son Güncelleme: {new Date(selectedRequest.updatedAt).toLocaleString("tr-TR")}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Price Quote Dialog */}
        <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fiyat Teklifi Ver</DialogTitle>
              <DialogDescription>
                {selectedRequest?.trackingNumber} - {selectedRequest?.customerName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="laborCost">İşçilik Maliyeti (₺)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    value={priceForm.laborCost}
                    onChange={(e) => {
                      const laborCost = e.target.value;
                      const partsCost = parseFloat(priceForm.partsCost) || 0;
                      const total = (parseFloat(laborCost) || 0) + partsCost;
                      setPriceForm({
                        ...priceForm,
                        laborCost,
                        finalPrice: total > 0 ? total.toString() : priceForm.finalPrice,
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="partsCost">Parça Maliyeti (₺)</Label>
                  <Input
                    id="partsCost"
                    type="number"
                    step="0.01"
                    value={priceForm.partsCost}
                    onChange={(e) => {
                      const partsCost = e.target.value;
                      const laborCost = parseFloat(priceForm.laborCost) || 0;
                      const total = laborCost + (parseFloat(partsCost) || 0);
                      setPriceForm({
                        ...priceForm,
                        partsCost,
                        finalPrice: total > 0 ? total.toString() : priceForm.finalPrice,
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="finalPrice">Toplam Fiyat (₺) *</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  step="0.01"
                  value={priceForm.finalPrice}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, finalPrice: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  İşçilik + Parça maliyeti otomatik hesaplanır veya manuel girebilirsiniz
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Yapılacak İşlemler ve Değişecek Parçalar</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRepairItem("labor")}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      İşlem Ekle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRepairItem("part")}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Parça Ekle
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {priceForm.repairItems.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start gap-3">
                        <Badge className={item.type === "labor" ? "bg-blue-500" : "bg-green-500"}>
                          {item.type === "labor" ? "İşlem" : "Parça"}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder={item.type === "labor" ? "Yapılacak işlem açıklaması" : "Parça adı ve açıklaması"}
                            value={item.description}
                            onChange={(e) => updateRepairItem(index, "description", e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Fiyat (₺)"
                              value={item.price}
                              onChange={(e) => updateRepairItem(index, "price", e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRepairItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {priceForm.repairItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Henüz işlem veya parça eklenmedi
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosisNotes">Tanı Notları</Label>
                <Textarea
                  id="diagnosisNotes"
                  value={priceForm.diagnosisNotes}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, diagnosisNotes: e.target.value })
                  }
                  rows={4}
                  placeholder="Cihazın durumu, yapılacak işlemler..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleSubmitPrice}>Fiyat Teklifi Ver</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Durum Güncelle</DialogTitle>
              <DialogDescription>
                {selectedRequest?.trackingNumber} - {selectedRequest?.customerName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Durum *</Label>
                <Select
                  value={statusForm.status}
                  onValueChange={(value) => setStatusForm({ ...statusForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="repairNotes">Tamir Notları</Label>
                <Textarea
                  id="repairNotes"
                  value={statusForm.repairNotes}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, repairNotes: e.target.value })
                  }
                  rows={4}
                  placeholder="Tamir süreci hakkında notlar..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleSubmitStatus}>Güncelle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}

