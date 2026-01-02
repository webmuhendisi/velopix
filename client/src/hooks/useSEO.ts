import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object | object[];
  // Article specific
  articleTags?: string[];
  articleSection?: string;
  // Product specific
  productPrice?: number | string;
  productCurrency?: string;
  productAvailability?: "in stock" | "out of stock" | "preorder";
  // Hreflang (for multi-language support)
  alternateUrls?: Array<{ lang: string; url: string }>;
  // Twitter card type
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
}

export function useSEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  structuredData,
  articleTags,
  articleSection,
  productPrice,
  productCurrency = "TRY",
  productAvailability,
  alternateUrls,
  twitterCard = "summary_large_image",
}: SEOProps) {
  useEffect(() => {
    const baseTitle = "VeloPix Computer - Gaming Bilgisayar, Laptop, Telefon ve Teknoloji Ürünleri";
    const baseDescription = "Gaming bilgisayar, laptop, telefon ve teknoloji ürünlerinde en iyi fiyatlar. Hızlı teslimat ve güvenli ödeme seçenekleri.";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");

    // Update title
    if (title) {
      document.title = `${title} | VeloPix Computer`;
    } else {
      document.title = baseTitle;
    }

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description || baseDescription);

    // Update or create meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords);
    }

    // Open Graph tags
    const updateOrCreateOG = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateOrCreateOG("og:title", title ? `${title} | VeloPix Computer` : baseTitle);
    updateOrCreateOG("og:description", description || baseDescription);
    updateOrCreateOG("og:type", type);
    updateOrCreateOG("og:url", currentUrl);
    if (image) {
      updateOrCreateOG("og:image", image.startsWith("http") ? image : `${baseUrl}${image}`);
    }

    // Twitter Card tags
    const updateOrCreateTwitter = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateOrCreateTwitter("twitter:card", twitterCard);
    updateOrCreateTwitter("twitter:title", title ? `${title} | VeloPix Computer` : baseTitle);
    updateOrCreateTwitter("twitter:description", description || baseDescription);
    if (image) {
      updateOrCreateTwitter("twitter:image", image.startsWith("http") ? image : `${baseUrl}${image}`);
    }

    // Article specific tags
    if (type === "article") {
      if (author) {
        updateOrCreateOG("article:author", author);
      }
      if (publishedTime) {
        updateOrCreateOG("article:published_time", publishedTime);
      }
      if (modifiedTime) {
        updateOrCreateOG("article:modified_time", modifiedTime);
      }
      if (articleSection) {
        updateOrCreateOG("article:section", articleSection);
      }
      if (articleTags && articleTags.length > 0) {
        articleTags.forEach((tag) => {
          const tagMeta = document.createElement("meta");
          tagMeta.setAttribute("property", "article:tag");
          tagMeta.setAttribute("content", tag);
          document.head.appendChild(tagMeta);
        });
      }
    }

    // Product specific tags
    if (type === "product") {
      if (productPrice !== undefined) {
        updateOrCreateOG("product:price:amount", typeof productPrice === "string" ? productPrice : productPrice.toString());
        updateOrCreateOG("product:price:currency", productCurrency);
      }
      if (productAvailability) {
        updateOrCreateOG("product:availability", productAvailability);
      }
      // Add product:condition
      updateOrCreateOG("product:condition", "new");
    }

    // Meta robots tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    // For product pages, allow indexing
    metaRobots.setAttribute("content", type === "product" ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" : "index, follow");

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // Alternate URLs (hreflang)
    if (alternateUrls && alternateUrls.length > 0) {
      // Remove existing alternate links
      const existingAlternates = document.querySelectorAll('link[rel="alternate"][hreflang]');
      existingAlternates.forEach((link) => link.remove());

      alternateUrls.forEach((alt) => {
        const alternateLink = document.createElement("link");
        alternateLink.setAttribute("rel", "alternate");
        alternateLink.setAttribute("hreflang", alt.lang);
        alternateLink.setAttribute("href", alt.url.startsWith("http") ? alt.url : `${baseUrl}${alt.url}`);
        document.head.appendChild(alternateLink);
      });
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data scripts
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach((script) => script.remove());

      // Handle single object or array of objects
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      
      dataArray.forEach((data) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    author,
    publishedTime,
    modifiedTime,
    structuredData,
    articleTags,
    articleSection,
    productPrice,
    productCurrency,
    productAvailability,
    alternateUrls,
    twitterCard,
  ]);
}

