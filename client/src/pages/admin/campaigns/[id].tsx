import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  title: string;
  type: string;
  description: string | null;
  startDate: string;
  endDate: string;
  active: boolean;
  products?: Array<{
    id: string;
    campaignId: string;
    productId: string;
    order: number;
    specialPrice: string | null;
    product?: {
      id: string;
      title: string;
      price: string;
      image: string | null;
    };
  }>;
}

interface Product {
  id: string;
  title: string;
  price: string;
  image: string | null;
}

export default function AdminCampaignDetail() {
  const [, params] = useRoute("/admin/campaigns/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [specialPrice, setSpecialPrice] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    if (params?.id) {
      fetchData();
      fetchAllProducts();
    }
  }, [token, params?.id, setLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/campaigns/${params?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch campaign");
      const data = await res.json();
      setCampaign(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kampanya yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${params?.id}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          order: campaign?.products?.length || 0,
          specialPrice: specialPrice || null,
        }),
      });

      if (!res.ok) throw new Error("Ürün eklenemedi");

      toast({ title: "Başarılı", description: "Ürün kampanyaya eklendi" });
      setIsDialogOpen(false);
      setSelectedProduct(null);
      setSpecialPrice("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ürün eklenemedi",
        variant: "destructive",
      });
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm("Bu ürünü kampanyadan çıkarmak istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${params?.id}/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Ürün çıkarılamadı");

      toast({ title: "Başarılı", description: "Ürün kampanyadan çıkarıldı" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ürün çıkarılamadı",
        variant: "destructive",
      });
    }
  };

  const handleMoveOrder = async (productId: string, direction: "up" | "down") => {
    if (!campaign?.products) return;

    const product = campaign.products.find((p) => p.productId === productId);
    if (!product) return;

    const currentOrder = product.order;
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

    const otherProduct = campaign.products.find((p) => p.order === newOrder);
    if (!otherProduct) return;

    try {
      await Promise.all([
        fetch(`/api/admin/campaigns/${params?.id}/products/${productId}/order`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: newOrder }),
        }),
        fetch(`/api/admin/campaigns/${params?.id}/products/${otherProduct.productId}/order`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: currentOrder }),
        }),
      ]);

      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sıralama güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const campaignProductIds = campaign?.products?.map((cp) => cp.productId) || [];
  const availableProducts = filteredProducts.filter((p) => !campaignProductIds.includes(p.id));

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Kampanya Detayı</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Kampanya Bulunamadı</h1>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/campaigns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              <p className="text-muted-foreground">{campaign.name}</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ürün Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ürün Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Ürün Ara</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Ürün adı ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchTerm ? "Ürün bulunamadı" : "Tüm ürünler zaten eklenmiş"}
                    </p>
                  ) : (
                    availableProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-secondary transition-colors ${
                          selectedProduct?.id === product.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          setSelectedProduct(product);
                          setSpecialPrice("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{product.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {parseFloat(product.price).toFixed(2)}₺
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedProduct && (
                  <div>
                    <Label htmlFor="specialPrice">Özel Fiyat (Opsiyonel)</Label>
                    <Input
                      id="specialPrice"
                      type="number"
                      step="0.01"
                      value={specialPrice}
                      onChange={(e) => setSpecialPrice(e.target.value)}
                      placeholder="Kampanya fiyatı (boş bırakılırsa normal fiyat kullanılır)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Normal fiyat: {parseFloat(selectedProduct.price).toFixed(2)}₺
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleAddProduct}
                    disabled={!selectedProduct}
                  >
                    Ekle
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kampanya Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Tip:</span>
                <Badge variant="outline" className="ml-2">
                  {campaign.type === "weekly" && "Haftanın Ürünleri"}
                  {campaign.type === "blackfriday" && "Black Friday"}
                  {campaign.type === "flash_sale" && "Flash Sale"}
                  {campaign.type === "limited_stock" && "Sınırlı Stok"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Durum:</span>
                {campaign.active ? (
                  <Badge className="bg-green-500 ml-2">Aktif</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">Pasif</Badge>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Başlangıç:</span>
                <span className="ml-2">
                  {new Date(campaign.startDate).toLocaleString("tr-TR")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Bitiş:</span>
                <span className="ml-2">
                  {new Date(campaign.endDate).toLocaleString("tr-TR")}
                </span>
              </div>
            </div>
            {campaign.description && (
              <div>
                <span className="text-muted-foreground">Açıklama:</span>
                <p className="mt-1">{campaign.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kampanya Ürünleri ({campaign.products?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!campaign.products || campaign.products.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Henüz ürün eklenmemiş
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Sıra</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Normal Fiyat</TableHead>
                    <TableHead>Kampanya Fiyatı</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.products
                    .sort((a, b) => a.order - b.order)
                    .map((cp, index) => (
                      <TableRow key={cp.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveOrder(cp.productId, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <span className="font-mono text-xs">{cp.order}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveOrder(cp.productId, "down")}
                              disabled={index === campaign.products!.length - 1}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {cp.product?.image && (
                              <img
                                src={cp.product.image}
                                alt={cp.product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{cp.product?.title || "Ürün bulunamadı"}</p>
                              {cp.product && (
                                <Link href={`/admin/products/${cp.product.id}/edit`} className="text-xs text-primary hover:underline">
                                  Düzenle
                                </Link>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cp.product?.price
                            ? `${parseFloat(cp.product.price).toFixed(2)}₺`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {cp.specialPrice ? (
                            <span className="font-bold text-primary">
                              {parseFloat(cp.specialPrice).toFixed(2)}₺
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Normal fiyat</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduct(cp.productId)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Çıkar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

