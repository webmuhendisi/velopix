import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, User, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbStructuredData } from "@/lib/structuredData";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  author: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Blog",
    description: "Teknoloji, elektronik ve daha fazlası hakkında güncel blog yazıları. Gaming bilgisayar, laptop, telefon ve teknoloji haberleri.",
    keywords: "blog, teknoloji, elektronik, gaming, bilgisayar, laptop, telefon",
    structuredData: getBreadcrumbStructuredData([
      { name: "Ana Sayfa", url: "/" },
      { name: "Blog", url: "/blog" },
    ]),
  });

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch blog posts");
        }
        return res.json();
      })
      .then((data) => {
        // Handle both array and paginated response
        const postsArray = Array.isArray(data) ? data : (data.posts || []);
        setPosts(postsArray);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching blog posts:", error);
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Teknoloji, elektronik ve daha fazlası hakkında güncel yazılar
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Henüz blog yazısı bulunmuyor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.featuredImage || "/placeholder.png"}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {post.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                    )}
                    {post.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <button className="flex items-center gap-2 text-primary hover:underline font-semibold">
                      Devamını Oku <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

