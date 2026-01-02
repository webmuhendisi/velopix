import { useEffect, useState } from "react";
import { Link } from "wouter";
import AdminLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, Folder, Users, Eye, TrendingUp, Globe } from "lucide-react";

interface AnalyticsStats {
  total: number;
  unique: number;
  topPages: Array<{ path: string; count: number }>;
  totalPages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    pendingOrders: 0,
  });
  const [analytics, setAnalytics] = useState<{
    day: AnalyticsStats;
    week: AnalyticsStats;
    month: AnalyticsStats;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("day");
  const [topPagesLimit, setTopPagesLimit] = useState<{
    day: number;
    week: number;
    month: number;
  }>({
    day: 10,
    week: 10,
    month: 10,
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    // Fetch stats
    Promise.all([
      fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([productsRes, categoriesRes, ordersRes]) => {
        const products = await productsRes.json();
        const categories = await categoriesRes.json();
        const orders = await ordersRes.json();
        const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
        setStats({
          products: products.length,
          categories: categories.length,
          orders: orders.length,
          pendingOrders,
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch analytics with initial limit
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/admin/analytics/stats/all?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const loadMorePages = async (period: "day" | "week" | "month") => {
    const token = localStorage.getItem("adminToken");
    if (!token || !analytics) return;

    const newLimit = topPagesLimit[period] + 10;
    setTopPagesLimit((prev) => ({ ...prev, [period]: newLimit }));

    try {
      const res = await fetch(`/api/admin/analytics/stats?period=${period}&limit=${newLimit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics((prev) => prev ? { ...prev, [period]: data } : null);
      }
    } catch (error) {
      console.error("Error loading more pages:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Genel istatistikler ve hızlı erişim</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ürünler</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.products}</div>
              <p className="text-xs text-muted-foreground">Toplam ürün sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.categories}</div>
              <p className="text-xs text-muted-foreground">Toplam kategori sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Siparişler</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.orders}</div>
              <p className="text-xs text-muted-foreground">Toplam sipariş sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Siparişler</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Onay bekleyen siparişler</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sayfa İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as "day" | "week" | "month")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">Günlük</TabsTrigger>
                <TabsTrigger value="week">Haftalık</TabsTrigger>
                <TabsTrigger value="month">Aylık</TabsTrigger>
              </TabsList>
              
              {["day", "week", "month"].map((period) => {
                const periodData = analytics?.[period as keyof typeof analytics];
                const periodLabel = period === "day" ? "Günlük" : period === "week" ? "Haftalık" : "Aylık";
                
                return (
                  <TabsContent key={period} value={period} className="space-y-4">
                    {analyticsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                    ) : periodData ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Toplam Ziyaret</CardTitle>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{periodData.total}</div>
                              <p className="text-xs text-muted-foreground">{periodLabel} toplam sayfa görüntüleme</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Tekil Ziyaretçi</CardTitle>
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{periodData.unique}</div>
                              <p className="text-xs text-muted-foreground">{periodLabel} benzersiz ziyaretçi</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Ortalama Ziyaret</CardTitle>
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {periodData.unique > 0 
                                  ? Math.round((periodData.total / periodData.unique) * 10) / 10 
                                  : 0}
                              </div>
                              <p className="text-xs text-muted-foreground">Ziyaretçi başına ortalama sayfa</p>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                En Çok Ziyaret Edilen Sayfalar
                              </div>
                              {periodData.totalPages > 0 && (
                                <span className="text-sm font-normal text-muted-foreground">
                                  {periodData.topPages.length} / {periodData.totalPages} sayfa
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {periodData.topPages.length > 0 ? (
                              <>
                                <div className="space-y-2">
                                  {periodData.topPages.map((page, index) => (
                                    <div
                                      key={page.path}
                                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                                          {index + 1}
                                        </div>
                                        <div>
                                          <div className="font-medium">{page.path || "/"}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {page.count} {page.count === 1 ? "ziyaret" : "ziyaret"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-sm font-semibold text-primary">
                                        {periodData.total > 0 
                                          ? Math.round((page.count / periodData.total) * 100) 
                                          : 0}%
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {periodData.topPages.length < periodData.totalPages && (
                                  <div className="mt-4 pt-4 border-t">
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => loadMorePages(period as "day" | "week" | "month")}
                                    >
                                      Daha Fazla Göster ({periodData.totalPages - periodData.topPages.length} sayfa daha)
                                    </Button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                Henüz {periodLabel.toLowerCase()} ziyaret kaydı bulunmuyor
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        İstatistik verisi bulunamadı
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/products">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  Ürün Yönetimi
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button className="w-full justify-start" variant="outline">
                  <Folder className="w-4 h-4 mr-2" />
                  Kategori Yönetimi
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sipariş Yönetimi
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

