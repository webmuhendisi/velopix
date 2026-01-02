import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { getBlogPostStructuredData, getBreadcrumbStructuredData } from "@/lib/structuredData";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  author: string | null;
  publishedAt: string | null;
  modifiedAt?: string | null;
  readingTime?: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export default function BlogPostDetail() {
  const [, params] = useRoute("/blog/:slug");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.slug) {
      fetch(`/api/blog/${params.slug}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Blog yazısı bulunamadı");
          }
          return res.json();
        })
        .then((data) => {
          setPost(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [params?.slug]);

  // Calculate word count from content (strip HTML tags)
  const calculateWordCount = (content: string): number => {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  // Calculate reading time if not provided (average reading speed: 200 words per minute)
  const calculateReadingTime = (content: string, providedReadingTime?: number | null): number => {
    if (providedReadingTime !== undefined && providedReadingTime !== null) {
      return providedReadingTime;
    }
    const wordCount = calculateWordCount(content);
    return Math.ceil(wordCount / 200); // 200 words per minute
  };

  const wordCount = post ? calculateWordCount(post.content) : 0;
  const readingTime = post ? calculateReadingTime(post.content, post.readingTime) : 0;

  useSEO({
    title: post?.metaTitle || post?.title,
    description: post?.metaDescription || post?.excerpt || post?.title,
    keywords: post?.metaKeywords,
    image: post?.featuredImage || undefined,
    url: post?.slug ? `/blog/${post.slug}` : undefined,
    type: "article",
    author: post?.author || undefined,
    publishedTime: post?.publishedAt || undefined,
    modifiedTime: post?.modifiedAt || post?.publishedAt || undefined,
    structuredData: post ? [
      getBlogPostStructuredData({
        title: post.title,
        description: post.metaDescription || post.excerpt,
        image: post.featuredImage,
        author: post.author,
        publishedAt: post.publishedAt,
        modifiedAt: post.modifiedAt,
        slug: post.slug,
        wordCount: wordCount,
        readingTime: readingTime,
        keywords: post.metaKeywords,
      }),
      getBreadcrumbStructuredData([
        { name: "Ana Sayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: post.title, url: `/blog/${post.slug}` },
      ]),
    ] : undefined,
  });

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

  if (error || !post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Yazısı Bulunamadı</h1>
          <p className="text-muted-foreground mb-6">{error || "Aradığınız blog yazısı bulunamadı"}</p>
          <Link href="/blog">
            <button className="text-primary hover:underline">Blog'a Dön</button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/blog">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Blog'a Dön
          </button>
        </Link>

        {post.featuredImage && (
          <div className="aspect-video overflow-hidden rounded-lg mb-8">
            <img
              src={post.featuredImage}
              alt={`${post.title} - Öne çıkan görsel`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {post.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </div>
            )}
            {readingTime > 0 && (
              <div className="flex items-center gap-2">
                <span>{readingTime} dakika okuma</span>
              </div>
            )}
            {wordCount > 0 && (
              <div className="flex items-center gap-2">
                <span>{wordCount.toLocaleString('tr-TR')} kelime</span>
              </div>
            )}
          </div>
        </header>

        <Card>
          <CardContent className="p-8">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, "<br />"),
              }}
            />
          </CardContent>
        </Card>
      </article>
    </Layout>
  );
}

