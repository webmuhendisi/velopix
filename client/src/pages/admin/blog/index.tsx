import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "../layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  author: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminBlogList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
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
      const res = await fetch("/api/admin/blog", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Blog yazıları yüklenemedi");
      }
      const data = await res.json();
      // Handle pagination response or direct array
      const postsArray = Array.isArray(data) ? data : (data.posts || []);
      setPosts(postsArray);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Blog yazıları yüklenemedi",
        variant: "destructive",
      });
      setPosts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Blog yazısı silindi" });
      fetchData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Yayınlanmadı";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Blog Yönetimi</h1>
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
            <h1 className="text-3xl font-bold">Blog Yönetimi</h1>
            <p className="text-muted-foreground">Blog yazılarını yönetin</p>
          </div>
          <Link href="/admin/blog/new">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Blog Yazısı
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Henüz blog yazısı bulunmuyor</p>
                <Link href="/admin/blog/new">
                  <Button className="mt-4">İlk Blog Yazısını Oluştur</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            /{post.slug}
                          </p>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {post.published ? (
                            <Badge className="bg-green-500">Yayında</Badge>
                          ) : (
                            <Badge variant="secondary">Taslak</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          <p>Yazar: {post.author || "Belirtilmemiş"}</p>
                          <p>Oluşturulma: {formatDate(post.createdAt)}</p>
                          <p>Yayın: {formatDate(post.publishedAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          {post.published && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Görüntüle
                              </Button>
                            </a>
                          )}
                          <Link href={`/admin/blog/${post.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-2" />
                              Düzenle
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

