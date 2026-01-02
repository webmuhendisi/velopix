import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  originalPrice: string | number | null;
  image: string | null;
  categoryId: string;
  isNew: boolean;
  limitedStock: number | null;
  inStock: boolean;
  slug?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}


export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }

    fetchData();
    fetchCategories();
  }, [token, setLocation]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          setLocation("/admin/login");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("Unexpected categories API response format:", data);
        setCategories([]);
      }
    } catch (error) {
      console.error("Kategoriler yüklenemedi:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          setLocation("/admin/login");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const productsData = await res.json();
      
      // Ensure productsData is an array
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        console.error("Unexpected API response format:", productsData);
        setProducts([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setProducts([]);
      toast({
        title: "Hata",
        description: "Veriler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Kategori adını bul
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "Bilinmeyen";
  };

  // Filtrelenmiş ürünler
  const filteredProducts = Array.isArray(products) 
    ? products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(product.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Ürün silindi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Ürün Yönetimi</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Fiyat formatla
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ürün Yönetimi</h1>
            <p className="text-muted-foreground">
              Toplam {products.length} ürün {searchTerm && `(${filteredProducts.length} sonuç)`}
            </p>
          </div>
          <Link href="/admin/products/new">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün
            </Button>
          </Link>
        </div>

        {/* Arama */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Ürün adı veya kategori ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tablo */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Görsel</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Fiyat</TableHead>
                <TableHead className="text-right">Orijinal Fiyat</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-right w-[120px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Arama sonucu bulunamadı" : "Henüz ürün eklenmemiş"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
                  const originalPrice = product.originalPrice 
                    ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice)
                    : null;
                  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

                  return (
                    <TableRow key={product.id} className="hover:bg-secondary/50">
                      <TableCell>
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{product.title}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getCategoryName(product.categoryId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {originalPrice ? (
                          <div>
                            <div className="text-muted-foreground line-through text-sm">
                              {formatPrice(originalPrice)}
                            </div>
                            {discount > 0 && (
                              <Badge variant="destructive" className="mt-1">
                                -%{discount}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.limitedStock !== null ? (
                          <Badge variant={product.limitedStock > 10 ? "default" : "destructive"}>
                            {product.limitedStock} adet
                          </Badge>
                        ) : (
                          <Badge variant={product.inStock ? "default" : "secondary"}>
                            {product.inStock ? "Stokta" : "Tükendi"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {product.isNew && (
                            <Badge variant="default" className="bg-green-600">
                              Yeni
                            </Badge>
                          )}
                          {!product.inStock && (
                            <Badge variant="secondary">Tükendi</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${product.slug || product.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

