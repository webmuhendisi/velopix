export function getOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VeloPix Computer",
    url: typeof window !== "undefined" ? window.location.origin : "",
    logo: typeof window !== "undefined" ? `${window.location.origin}/assets/logo.png` : "",
    description: "Gaming bilgisayar, laptop, telefon ve teknoloji ürünlerinde en iyi fiyatlar. Hızlı teslimat ve güvenli ödeme seçenekleri.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-533-833-21-11",
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: "Turkish",
    },
    sameAs: [
      // Social media links can be added here
    ],
  };
}

export function getProductStructuredData(product: {
  id: string;
  title: string;
  description?: string | null;
  price: number | string;
  originalPrice?: number | string | null;
  image?: string | null;
  ogImage?: string | null;
  category?: string;
  inStock?: boolean;
  slug?: string | null;
  sku?: string | null;
  brand?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  ratingValue?: number;
  reviewCount?: number;
  reviews?: Array<{
    author: string;
    datePublished: string;
    reviewBody: string;
    reviewRating: {
      ratingValue: number;
      bestRating: number;
    };
  }>;
}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const originalPrice = product.originalPrice 
    ? (typeof product.originalPrice === "string" ? parseFloat(product.originalPrice) : product.originalPrice)
    : null;

  // Build product URL - prefer slug over id
  const productUrl = product.slug 
    ? `${baseUrl}/product/${product.slug}`
    : product.slug 
      ? `${baseUrl}/product/${product.slug}`
      : `${baseUrl}/product/${product.id}`;

  // Build images array
  const images: string[] = [];
  if (product.image) {
    const imageUrl = product.image.startsWith("http") 
      ? product.image 
      : `${baseUrl}${product.image}`;
    images.push(imageUrl);
  }
  if (product.ogImage && product.ogImage !== product.image) {
    const ogImageUrl = product.ogImage.startsWith("http")
      ? product.ogImage
      : `${baseUrl}${product.ogImage}`;
    if (!images.includes(ogImageUrl)) {
      images.push(ogImageUrl);
    }
  }

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD", // Price is displayed in USD
      price: price.toString(),
      availability: product.inStock !== false 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      seller: {
        "@type": "Organization",
        name: "VeloPix Computer",
      },
    },
  };

  // Add images
  if (images.length > 0) {
    structuredData.image = images.length === 1 ? images[0] : images;
  }

  // Add brand
  if (product.brand) {
    structuredData.brand = {
      "@type": "Brand",
      name: product.brand,
    };
  }

  // Add product identifiers
  if (product.sku) {
    structuredData.sku = product.sku;
  }
  if (product.gtin) {
    structuredData.gtin = product.gtin;
  }
  if (product.mpn) {
    structuredData.mpn = product.mpn;
  }

  // Add aggregate rating if available
  if (product.ratingValue !== undefined && product.reviewCount !== undefined && product.reviewCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingValue.toString(),
      reviewCount: product.reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Add reviews if available
  if (product.reviews && product.reviews.length > 0) {
    structuredData.review = product.reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      datePublished: review.datePublished,
      reviewBody: review.reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.reviewRating.ratingValue.toString(),
        bestRating: review.reviewRating.bestRating.toString(),
        worstRating: "1",
      },
    }));
  }

  // Add price specification if original price exists
  if (originalPrice && originalPrice > price) {
    structuredData.offers.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price: price.toString(),
      priceCurrency: "USD",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: "1",
        unitCode: "C62", // unit (piece)
      },
    };
  }
  
  // Add product URL
  structuredData.url = productUrl;
  
  // Add manufacturer if brand exists
  if (product.brand) {
    structuredData.manufacturer = {
      "@type": "Brand",
      name: product.brand,
    };
  }

  return structuredData;
}

export function getBlogPostStructuredData(post: {
  title: string;
  description?: string | null;
  image?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  slug: string;
  wordCount?: number;
  readingTime?: number;
  keywords?: string | null;
  category?: string;
}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || post.title,
    author: {
      "@type": "Person",
      name: post.author || "VeloPix Computer",
    },
    publisher: {
      "@type": "Organization",
      name: "VeloPix Computer",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/assets/logo.png`,
      },
    },
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified: post.modifiedAt || post.publishedAt || new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  };

  // Add image
  if (post.image) {
    const imageUrl = post.image.startsWith("http") 
      ? post.image 
      : `${baseUrl}${post.image}`;
    structuredData.image = imageUrl;
  }

  // Add word count
  if (post.wordCount !== undefined && post.wordCount > 0) {
    structuredData.wordCount = post.wordCount.toString();
  }

  // Add time required (reading time) in ISO 8601 duration format
  if (post.readingTime !== undefined && post.readingTime > 0) {
    structuredData.timeRequired = `PT${post.readingTime}M`; // PT5M = 5 minutes
  }

  // Add keywords
  if (post.keywords) {
    structuredData.keywords = post.keywords;
  }

  // Add article section (category)
  if (post.category) {
    structuredData.articleSection = post.category;
  }

  return structuredData;
}

export function getWebsiteStructuredData() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VeloPix Computer",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

export function getFAQStructuredData(faqs: Array<{
  question: string;
  answer: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getVideoStructuredData(video: {
  name: string;
  description?: string;
  thumbnailUrl: string;
  contentUrl: string;
  embedUrl?: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration format (e.g., "PT5M30S")
}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description || video.name,
    thumbnailUrl: video.thumbnailUrl.startsWith("http")
      ? video.thumbnailUrl
      : `${baseUrl}${video.thumbnailUrl}`,
    contentUrl: video.contentUrl.startsWith("http")
      ? video.contentUrl
      : `${baseUrl}${video.contentUrl}`,
    uploadDate: video.uploadDate,
  };

  if (video.embedUrl) {
    structuredData.embedUrl = video.embedUrl.startsWith("http")
      ? video.embedUrl
      : `${baseUrl}${video.embedUrl}`;
  }

  if (video.duration) {
    structuredData.duration = video.duration;
  }

  return structuredData;
}

