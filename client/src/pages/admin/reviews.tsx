import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerPhone: string | null;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
  approved: boolean;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    slug: string | null;
  };
}

export default function AdminReviews() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

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
      // Fetch all products first to get reviews
      const productsRes = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!productsRes.ok) throw new Error("Failed to fetch products");
      const products = await productsRes.json();

      // Fetch reviews for all products
      const allReviews: Review[] = [];
      for (const product of products) {
        try {
          const reviewsRes = await fetch(`/api/products/${product.id}/reviews`);
          if (reviewsRes.ok) {
            const data = await reviewsRes.json();
            const productReviews = (data.reviews || []).map((r: any) => ({
              ...r,
              product: { id: product.id, title: product.title, slug: product.slug },
            }));
            allReviews.push(...productReviews);
          }
        } catch (error) {
          console.error(`Failed to fetch reviews for product ${product.id}:`, error);
        }
      }

      setReviews(allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorumlar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/reviews/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: true }),
      });

      if (!res.ok) throw new Error("Yorum onaylanamadı");

      toast({ title: "Başarılı", description: "Yorum onaylandı" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorum onaylanamadı",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Bu yorumu reddetmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/admin/products/reviews/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: false }),
      });

      if (!res.ok) throw new Error("Yorum reddedilemedi");

      toast({ title: "Başarılı", description: "Yorum reddedildi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorum reddedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/admin/products/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Yorum silinemedi");

      toast({ title: "Başarılı", description: "Yorum silindi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorum silinemedi",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "approved") return review.approved;
    if (filter === "pending") return !review.approved;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Ürün Yorumları</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ürün Yorumları</h1>
            <p className="text-muted-foreground">
              Toplam {reviews.length} yorum ({reviews.filter((r) => r.approved).length} onaylı,{" "}
              {reviews.filter((r) => !r.approved).length} bekleyen)
            </p>
          </div>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="approved">Onaylı</SelectItem>
              <SelectItem value="pending">Bekleyen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Henüz yorum bulunmuyor</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Puan</TableHead>
                  <TableHead>Yorum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      {review.product ? (
                        <Link
                          href={review.product.slug ? `/product/${review.product.slug}` : `/product/${review.product.id}`}
                          className="text-primary hover:underline"
                        >
                          {review.product.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Ürün bulunamadı</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{review.customerName}</p>
                        {review.customerPhone && (
                          <p className="text-xs text-muted-foreground">{review.customerPhone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm font-medium">{review.rating}/5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-md truncate">{review.comment || "-"}</p>
                    </TableCell>
                    <TableCell>
                      {review.approved ? (
                        <Badge className="bg-green-500">Onaylı</Badge>
                      ) : (
                        <Badge variant="outline">Beklemede</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(review.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!review.approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Onayla
                          </Button>
                        )}
                        {review.approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(review.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reddet
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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

