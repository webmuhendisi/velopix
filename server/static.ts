import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// HTML attribute escape function (for content attributes)
function escapeHtmlAttribute(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
}

// HTML text content escape function (for title, etc.)
function escapeHtmlText(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Handle product routes with dynamic SEO
  app.get("/product/:idOrSlug", async (req: Request, res: Response) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const product = await storage.getProductByIdOrSlug(idOrSlug);
      
      if (product) {
        // Read the base HTML file
        const htmlPath = path.resolve(distPath, "index.html");
        let html = fs.readFileSync(htmlPath, "utf-8");
        
        // Build product URL
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const productUrl = product.slug 
          ? `${baseUrl}/product/${product.slug}`
          : `${baseUrl}/product/${product.id}`;
        
        // Prepare SEO data
        const seoTitle = escapeHtmlText(product.metaTitle || product.title || "Ürün");
        let seoDescription = product.metaDescription || product.description || 
          `${product.title} - ${product.brand || "Teknoloji"} kategorisinde en uygun fiyat. Hızlı teslimat ve güvenli ödeme.`;
        if (seoDescription.length > 160) {
          seoDescription = seoDescription.substring(0, 157) + "...";
        }
        seoDescription = escapeHtmlAttribute(seoDescription);
        const seoImage = product.ogImage || product.image || `${baseUrl}/opengraph.jpg`;
        const absoluteImage = seoImage.startsWith("http") ? seoImage : `${baseUrl}${seoImage.startsWith("/") ? "" : "/"}${seoImage}`;
        
        // Update title
        html = html.replace(
          /<title>.*?<\/title>/,
          `<title>${seoTitle} | VeloPix Computer</title>`
        );
        
        // Update meta description
        html = html.replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
          `<meta name="description" content="${seoDescription}" />`
        );
        
        // Update Open Graph tags
        html = html.replace(
          /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/,
          `<meta property="og:type" content="product" />`
        );
        html = html.replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
          `<meta property="og:url" content="${productUrl}" />`
        );
        html = html.replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
          `<meta property="og:title" content="${seoTitle} | VeloPix Computer" />`
        );
        html = html.replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
          `<meta property="og:description" content="${seoDescription}" />`
        );
        html = html.replace(
          /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
          `<meta property="og:image" content="${absoluteImage}" />`
        );
        
        // Update Twitter Card tags
        html = html.replace(
          /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/,
          `<meta name="twitter:url" content="${productUrl}" />`
        );
        html = html.replace(
          /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
          `<meta name="twitter:title" content="${seoTitle} | VeloPix Computer" />`
        );
        html = html.replace(
          /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
          `<meta name="twitter:description" content="${seoDescription}" />`
        );
        html = html.replace(
          /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
          `<meta name="twitter:image" content="${absoluteImage}" />`
        );
        
        // Add canonical URL
        if (!html.includes('rel="canonical"')) {
          html = html.replace(
            /<\/head>/,
            `<link rel="canonical" href="${productUrl}" />\n</head>`
          );
        } else {
          html = html.replace(
            /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
            `<link rel="canonical" href="${productUrl}" />`
          );
        }
        
        // Fetch additional data for structured data
        const [category, reviews, rating, productImages] = await Promise.all([
          product.categoryId ? storage.getCategory(product.categoryId).catch(() => null) : Promise.resolve(null),
          storage.getProductReviews(product.id, true).catch(() => []),
          storage.getProductAverageRating(product.id).catch(() => ({ average: 0, count: 0 })),
          storage.getProductImages(product.id).catch(() => []),
        ]);
        
        // Build structured data (JSON-LD)
        const structuredDataArray: any[] = [];
        
        // Product structured data
        const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
        const originalPrice = product.originalPrice 
          ? (typeof product.originalPrice === "string" ? parseFloat(product.originalPrice) : product.originalPrice)
          : null;
        
        // Build images array
        const images: string[] = [];
        if (product.image) {
          const imageUrl = product.image.startsWith("http") 
            ? product.image 
            : `${baseUrl}${product.image.startsWith("/") ? "" : "/"}${product.image}`;
          images.push(imageUrl);
        }
        if (product.ogImage && product.ogImage !== product.image) {
          const ogImageUrl = product.ogImage.startsWith("http")
            ? product.ogImage
            : `${baseUrl}${product.ogImage.startsWith("/") ? "" : "/"}${product.ogImage}`;
          if (!images.includes(ogImageUrl)) {
            images.push(ogImageUrl);
          }
        }
        // Add product images
        productImages.forEach((img) => {
          const imgUrl = img.imageUrl.startsWith("http")
            ? img.imageUrl
            : `${baseUrl}${img.imageUrl.startsWith("/") ? "" : "/"}${img.imageUrl}`;
          if (!images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        });
        
        const productStructuredData: any = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description || product.title,
          category: category?.name || product.brand || "Teknoloji",
          url: productUrl,
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "USD",
            price: price.toString(),
            availability: product.inStock !== false 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            seller: {
              "@type": "Organization",
              name: "VeloPix Computer",
            },
          },
        };
        
        // Add images
        if (images.length > 0) {
          productStructuredData.image = images.length === 1 ? images[0] : images;
        }
        
        // Add brand
        if (product.brand) {
          productStructuredData.brand = {
            "@type": "Brand",
            name: product.brand,
          };
        }
        
        // Add product identifiers
        if (product.sku) {
          productStructuredData.sku = product.sku;
        }
        if (product.gtin) {
          productStructuredData.gtin = product.gtin;
        }
        if (product.mpn) {
          productStructuredData.mpn = product.mpn;
        }
        
        // Add aggregate rating
        if (rating.count > 0) {
          productStructuredData.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: rating.average.toString(),
            reviewCount: rating.count.toString(),
            bestRating: "5",
            worstRating: "1",
          };
        }
        
        // Add reviews
        if (reviews.length > 0) {
          productStructuredData.review = reviews.map((review) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: review.customerName || "Müşteri",
            },
            datePublished: review.createdAt || new Date().toISOString(),
            reviewBody: review.comment || "",
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating.toString(),
              bestRating: "5",
              worstRating: "1",
            },
          }));
        }
        
        structuredDataArray.push(productStructuredData);
        
        // Breadcrumb structured data
        const breadcrumbStructuredData = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ana Sayfa",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Ürünler",
              item: `${baseUrl}/products`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: product.title,
              item: productUrl,
            },
          ],
        };
        structuredDataArray.push(breadcrumbStructuredData);
        
        // Organization structured data
        const organizationStructuredData = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "VeloPix Computer",
          url: baseUrl,
          logo: `${baseUrl}/assets/logo.png`,
          description: "Gaming bilgisayar, laptop, telefon ve teknoloji ürünlerinde en iyi fiyatlar. Hızlı teslimat ve güvenli ödeme seçenekleri.",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+90-533-833-21-11",
            contactType: "customer service",
            areaServed: "TR",
            availableLanguage: "Turkish",
          },
        };
        structuredDataArray.push(organizationStructuredData);
        
        // Add JSON-LD structured data to HTML
        const structuredDataScript = structuredDataArray
          .map(data => `<script type="application/ld+json">${JSON.stringify(data, null, 2)}</script>`)
          .join("\n");
        
        html = html.replace(
          /<\/head>/,
          `${structuredDataScript}\n</head>`
        );
        
        res.send(html);
        return;
      }
    } catch (error) {
      // If error, fall through to default index.html
      console.error("Error generating dynamic HTML for product:", error);
    }
    
    // Fall through to default index.html if product not found or error
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
