import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import NodeCache from "node-cache";
import path from "path";
import { storage } from "./storage";
import { env } from "./config";
import {
  insertProductSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertInternetPackageSchema,
  insertRepairServiceSchema,
  insertRepairRequestSchema,
  insertSlideSchema,
  insertBlogPostSchema,
  insertSettingSchema,
  insertShippingRegionSchema,
  insertProductImageSchema,
  insertProductReviewSchema,
  insertNewsletterSubscriptionSchema,
  insertContactMessageSchema,
  insertFAQSchema,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { upload, optimizeUploadedImage } from "./upload";
import * as cheerio from "cheerio";

// Cache configuration
const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
});

// Cache keys
const CACHE_KEYS = {
  SITEMAP: "sitemap",
  CATEGORIES: "categories",
  SETTINGS: "settings",
  PRODUCTS_LIST: "products_list",
  EXCHANGE_RATE: "exchange_rate",
} as const;

// Exchange rate API URL
const EXCHANGE_RATE_API_URL = "https://online.sundoviz.com/services/api.php";

// Function to fetch USD exchange rate
async function getUSDExchangeRate(): Promise<number> {
  try {
    // Check cache first (cache for 1 hour)
    const cached = cache.get<number>(CACHE_KEYS.EXCHANGE_RATE);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await fetch(EXCHANGE_RATE_API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();
    const usdRate = data.find((item: any) => item.dovizcins === "USD");
    
    if (!usdRate || !usdRate.satisKur) {
      throw new Error("USD rate not found in API response");
    }

    const rate = parseFloat(usdRate.satisKur);
    
    // Cache for 1 hour (3600 seconds)
    cache.set(CACHE_KEYS.EXCHANGE_RATE, rate, 3600);
    
    return rate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Return a default rate if API fails (fallback)
    return 42.95; // Default fallback rate
  }
}

// Simple session storage for admin auth (in production, use proper session store)
const adminSessions = new Map<string, { userId: string; username: string }>();

// Middleware to check admin authentication
function requireAuth(req: Request, res: Response, next: () => void) {
  const sessionId = req.headers.authorization?.replace("Bearer ", "");
  if (!sessionId || !adminSessions.has(sessionId)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).user = adminSessions.get(sessionId);
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Public API routes
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const search = req.query.search as string | undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const brand = req.query.brand as string | undefined;
      const inStock = req.query.inStock === "true" ? true : req.query.inStock === "false" ? false : undefined;
      const sortBy = req.query.sortBy as string | undefined; // price_asc, price_desc, date_desc, rating
      
      let products = await storage.getProducts(categoryId);
      
      // Apply filters
      if (search) {
        products = products.filter(p => 
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (minPrice !== undefined) {
        products = products.filter(p => {
          const price = typeof p.price === "string" ? parseFloat(p.price) : p.price;
          return price >= minPrice;
        });
      }
      if (maxPrice !== undefined) {
        products = products.filter(p => {
          const price = typeof p.price === "string" ? parseFloat(p.price) : p.price;
          return price <= maxPrice;
        });
      }
      if (brand) {
        products = products.filter(p => p.brand?.toLowerCase() === brand.toLowerCase());
      }
      if (inStock !== undefined) {
        products = products.filter(p => p.inStock === inStock);
      }
      
      // Apply sorting
      if (sortBy === "price_asc") {
        products.sort((a, b) => {
          const priceA = typeof a.price === "string" ? parseFloat(a.price) : a.price;
          const priceB = typeof b.price === "string" ? parseFloat(b.price) : b.price;
          return priceA - priceB;
        });
      } else if (sortBy === "price_desc") {
        products.sort((a, b) => {
          const priceA = typeof a.price === "string" ? parseFloat(a.price) : a.price;
          const priceB = typeof b.price === "string" ? parseFloat(b.price) : b.price;
          return priceB - priceA;
        });
      } else if (sortBy === "date_desc") {
        products.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }
      // rating sorting would require fetching ratings, skip for now
      
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products", message: error?.message || "Unknown error" });
    }
  });

  // Optimized: Single endpoint that handles both slug and ID
  // This reduces API calls from 2 to 1 when slug is used
  app.get("/api/products/:idOrSlug", async (req: Request, res: Response) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const product = await storage.getProductByIdOrSlug(idOrSlug);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      
      // SEO: If accessed by ID but has slug, include redirect info in response
      // Frontend will handle the redirect to prevent duplicate content
      if (product.slug && idOrSlug !== product.slug && idOrSlug === product.id) {
        // Product accessed by ID but has slug - include redirect info
        res.json({
          ...product,
          _shouldRedirect: true,
          _canonicalUrl: `/product/${product.slug}`
        });
        return;
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Keep slug route for backward compatibility (optional, can be removed)
  app.get("/api/products/slug/:slug", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const hierarchical = req.query.hierarchical === "true";
      const cacheKey = `${CACHE_KEYS.CATEGORIES}${hierarchical ? "_hierarchical" : ""}`;
      
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      if (hierarchical) {
        const categories = await storage.getCategoriesHierarchical();
        // Cache for 1 hour
        cache.set(cacheKey, categories, 3600);
        res.json(categories);
      } else {
        // Tüm kategoriler (düz liste) - Tüm alanları explicit olarak döndür
        const [categories, productCounts] = await Promise.all([
          storage.getCategories(),
          storage.getCategoryProductCounts(),
        ]);
        const formatted = await Promise.all(categories.map(async cat => {
          let productCount = productCounts.get(cat.id) || 0;
          
          // Eğer ana kategori ise (parentId === null), alt kategorilerin toplamını ekle
          if (!cat.parentId) {
            productCount = await storage.getCategoryTotalProductCount(cat.id, productCounts);
          }
          
          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parentId: cat.parentId ?? null,
            icon: cat.icon ?? null,
            order: cat.order ?? 0,
            productCount,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
          };
        }));
        // Cache for 1 hour
        cache.set(cacheKey, formatted, 3600);
        res.json(formatted);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/hierarchical", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategoriesHierarchical();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/parent/:parentId", async (req: Request, res: Response) => {
    try {
      const parentId = req.params.parentId === "null" ? null : req.params.parentId;
      const [categories, productCounts] = await Promise.all([
        storage.getCategoriesByParent(parentId),
        storage.getCategoryProductCounts(),
      ]);
      // Tüm alanları explicit olarak döndür ve ürün sayısını ekle
      // Ana kategoriler için (parentId === null) alt kategorilerin toplamını hesapla
      const formatted = await Promise.all(categories.map(async cat => {
        let productCount = productCounts.get(cat.id) || 0;
        
        // Eğer ana kategori ise (parentId === null), alt kategorilerin toplamını ekle
        if (parentId === null) {
          productCount = await storage.getCategoryTotalProductCount(cat.id, productCounts);
        }
        
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId ?? null,
          icon: cat.icon ?? null,
          order: cat.order ?? 0,
          productCount,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        };
      }));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Admin authentication
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "Username and password required" });
        return;
      }

      console.log(`[LOGIN] Attempting login for user: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[LOGIN] User not found: ${username}`);
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      console.log(`[LOGIN] User found: ${user.username}, comparing password...`);
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.error(`[LOGIN] Password mismatch for user: ${username}`);
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      console.log(`[LOGIN] Password valid, creating session...`);
      
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      adminSessions.set(sessionId, { userId: user.id, username: user.username });

      console.log(`[LOGIN] Login successful for user: ${username}`);
      
      res.json({ token: sessionId, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error: any) {
      console.error("[LOGIN] Error:", error);
      console.error("[LOGIN] Error message:", error.message);
      console.error("[LOGIN] Error stack:", error.stack);
      const errorMessage = error.message || "Login failed";
      const errorDetails = process.env.NODE_ENV === "development" ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined;
      res.status(500).json({ 
        error: errorMessage,
        ...(errorDetails && { details: errorDetails })
      });
    }
  });

  // Admin Profile routes
  app.get("/api/admin/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userData = await storage.getUser(user.userId);
      if (!userData) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      // Password'u döndürme
      const { password, ...userWithoutPassword } = userData;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/admin/profile/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: "Current password and new password are required" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: "New password must be at least 6 characters" });
        return;
      }

      // Mevcut şifreyi kontrol et
      const userData = await storage.getUser(user.userId);
      if (!userData) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isValid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      // Şifreyi güncelle
      await storage.updateUser(user.userId, { password: newPassword });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Bing Images Search endpoint
  app.get("/api/admin/search-images", requireAuth, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ error: "Query parameter 'q' is required" });
        return;
      }

      // Bing Images arama URL'i - büyük görseller için optimize edilmiş
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:imagesize-large+filterui:photo-photo+filterui:aspect-square&FORM=IRFLTR`;
      
      // Bing Images sayfasını fetch et
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.bing.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Bing Images: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const images: Array<{ url: string; thumbnail: string; title: string }> = [];
      const seenUrls = new Set<string>(); // Duplicate kontrolü için
      
      // Bing Images HTML'inden görsel URL'lerini çıkar
      // Bing Images, görselleri data-m attribute'unda JSON olarak saklar
      $('a.iusc').each((index, element) => {
        if (images.length >= 5) return false; // İlk 5 görsel
        
        const $el = $(element);
        const mAttr = $el.attr('m');
        
        if (mAttr) {
          try {
            const data = JSON.parse(mAttr);
            // murl: orijinal görsel URL'i, turl: thumbnail URL'i
            const imageUrl = data.murl || data.purl;
            const thumbnailUrl = data.turl || data.murl || data.purl;
            const title = data.t || data.desc || query;
            
            if (imageUrl && !seenUrls.has(imageUrl)) {
              // URL'lerin geçerli olduğundan emin ol
              if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                seenUrls.add(imageUrl);
                images.push({
                  url: imageUrl,
                  thumbnail: thumbnailUrl || imageUrl,
                  title: title || query
                });
              }
            }
          } catch (e) {
            // JSON parse hatası, devam et
            console.warn("[BING IMAGES] Parse error:", e);
          }
        }
      });

      // Alternatif yöntem: img tag'lerinden direkt URL çıkar
      if (images.length < 5) {
        $('img.mimg').each((index, element) => {
          if (images.length >= 5) return false;
          
          const $img = $(element);
          const src = $img.attr('src');
          const dataSrc = $img.attr('data-src');
          const imageUrl = dataSrc || src;
          
          if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            // Zaten eklenmiş mi kontrol et
            if (!seenUrls.has(imageUrl)) {
              seenUrls.add(imageUrl);
              images.push({
                url: imageUrl,
                thumbnail: imageUrl,
                title: query
              });
            }
          }
        });
      }

      // Eğer hala yeterli görsel yoksa, data-src attribute'larını kontrol et
      if (images.length < 5) {
        $('[data-src]').each((index, element) => {
          if (images.length >= 5) return false;
          
          const $el = $(element);
          const dataSrc = $el.attr('data-src');
          
          if (dataSrc && (dataSrc.startsWith('http://') || dataSrc.startsWith('https://'))) {
            // Thumbnail değil, gerçek görsel URL'i olmalı
            if (dataSrc.includes('th.bing.com') || dataSrc.includes('bing.com/th')) {
              // Bu bir thumbnail, atla
              return;
            }
            
            if (!seenUrls.has(dataSrc)) {
              seenUrls.add(dataSrc);
              images.push({
                url: dataSrc,
                thumbnail: dataSrc,
                title: query
              });
            }
          }
        });
      }

      // Sonuçları temizle ve doğrula
      const cleanedImages = images
        .filter(img => img.url && img.url.length > 0)
        .slice(0, 5)
        .map(img => ({
          url: img.url.trim(),
          thumbnail: img.thumbnail.trim(),
          title: (img.title || query).trim()
        }));

      res.json({ images: cleanedImages });
    } catch (error: any) {
      console.error("[BING IMAGES] Error:", error);
      res.status(500).json({ 
        error: "Failed to search images", 
        details: error.message,
        images: [] // Hata durumunda boş array döndür
      });
    }
  });

  // Download and upload image from URL
  app.post("/api/admin/download-image", requireAuth, async (req: Request, res: Response) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        res.status(400).json({ error: "imageUrl is required" });
        return;
      }

      // Görseli indir
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!imageResponse.ok) {
        throw new Error("Failed to download image");
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      
      // Geçici dosya olarak kaydet ve upload et
      const tempPath = path.join(process.cwd(), 'client', 'public', 'uploads', `temp-${Date.now()}.jpg`);
      const fs = await import('fs/promises');
      const uploadsDir = path.join(process.cwd(), 'client', 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(tempPath, buffer);

      // Upload fonksiyonunu kullanarak görseli yükle
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const finalPath = path.join(uploadsDir, `product-${uniqueSuffix}.jpg`);
      await fs.rename(tempPath, finalPath);

      // Görseli optimize et
      const optimizedUrl = await optimizeUploadedImage(finalPath);
      const relativePath = optimizedUrl.replace(path.join(process.cwd(), 'client', 'public'), '').replace(/\\/g, '/');

      res.json({ url: relativePath });
    } catch (error: any) {
      console.error("[DOWNLOAD IMAGE] Error:", error);
      res.status(500).json({ error: "Failed to download and upload image", details: error.message });
    }
  });

  // Admin routes - require authentication
  app.get("/api/admin/products", requireAuth, async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const products = await storage.getProducts(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/admin/products/:idOrSlug", requireAuth, async (req: Request, res: Response) => {
    try {
      const product = await storage.getProductByIdOrSlug(req.params.idOrSlug);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/admin/products", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Received product data:", JSON.stringify(req.body, null, 2));
      const validated = insertProductSchema.parse(req.body);
      
      // If slug is empty string, set to undefined so it gets auto-generated
      if (validated.slug === "" || (validated.slug && !validated.slug.trim())) {
        validated.slug = undefined;
      }
      
      console.log("Validated product data:", JSON.stringify(validated, null, 2));
      const product = await storage.createProduct(validated);
      
      // Invalidate cache
      cache.del(CACHE_KEYS.PRODUCTS_LIST);
      cache.del(`${CACHE_KEYS.PRODUCTS_LIST}_${product.categoryId}`);
      cache.del(CACHE_KEYS.SITEMAP);
      
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Product creation error:", error);
      // Zod validation hatalarını daha detaylı göster
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: `Validation error: ${errorMessages}`, details: error.errors });
      } else {
        res.status(400).json({ error: error.message || "Invalid product data", details: error });
      }
    }
  });

  app.put("/api/admin/products/:idOrSlug", requireAuth, async (req: Request, res: Response) => {
    try {
      const existingProduct = await storage.getProductByIdOrSlug(req.params.idOrSlug);
      if (!existingProduct) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const validated = insertProductSchema.partial().parse(req.body);
      
      // If slug is empty string or whitespace, set it to undefined so it gets auto-generated
      if (validated.slug === "" || (validated.slug && typeof validated.slug === 'string' && !validated.slug.trim())) {
        validated.slug = undefined;
      }
      
      const product = await storage.updateProduct(existingProduct.id, validated);
      
      // Invalidate cache
      cache.del(CACHE_KEYS.PRODUCTS_LIST);
      cache.del(`${CACHE_KEYS.PRODUCTS_LIST}_${product.categoryId}`);
      cache.del(CACHE_KEYS.SITEMAP);
      
      res.json(product);
    } catch (error: any) {
      // Zod validation hatalarını daha detaylı göster
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: `Validation error: ${errorMessages}` });
      } else {
        res.status(400).json({ error: error.message || "Invalid product data" });
      }
    }
  });

  // Product Images - Public
  app.get("/api/products/:idOrSlug/images", async (req: Request, res: Response) => {
    try {
      // Önce slug veya ID ile ürünü bul
      const product = await storage.getProductByIdOrSlug(req.params.idOrSlug);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      // Ürün ID'si ile görselleri getir
      const images = await storage.getProductImages(product.id);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product images" });
    }
  });

  // Product Images - Admin
  app.post("/api/admin/products/:id/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertProductImageSchema.parse({ ...req.body, productId: req.params.id });
      const image = await storage.createProductImage(validated);
      res.status(201).json(image);
    } catch (error) {
      res.status(400).json({ error: "Invalid image data" });
    }
  });

  app.delete("/api/admin/products/images/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteProductImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Set product image as primary
  app.put("/api/admin/products/:productId/images/:imageId/set-primary", requireAuth, async (req: Request, res: Response) => {
    try {
      const { productId, imageId } = req.params;
      
      // Get the image to set as primary
      const allImages = await storage.getProductImages(productId);
      const targetImage = allImages.find(img => img.id === imageId);
      
      if (!targetImage) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      // Set all images to non-primary first
      for (const img of allImages) {
        if (img.isPrimary) {
          await storage.updateProductImage(img.id, { isPrimary: false });
        }
      }

      // Set target image as primary
      await storage.updateProductImage(imageId, { isPrimary: true });

      // Update product's main image
      await storage.updateProduct(productId, { image: targetImage.imageUrl });

      res.json({ success: true, image: { ...targetImage, isPrimary: true } });
    } catch (error: any) {
      console.error("Failed to set primary image:", error);
      res.status(500).json({ error: error.message || "Failed to set primary image" });
    }
  });

  // Product Reviews - Public
  app.get("/api/products/:id/reviews", async (req: Request, res: Response) => {
    try {
      const approved = req.query.approved !== "false";
      const reviews = await storage.getProductReviews(req.params.id, approved);
      const rating = await storage.getProductAverageRating(req.params.id);
      res.json({ reviews, rating });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/products/:id/reviews", async (req: Request, res: Response) => {
    try {
      const validated = insertProductReviewSchema.parse({ ...req.body, productId: req.params.id, approved: false });
      const review = await storage.createProductReview(validated);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid review data" });
    }
  });

  // Product Reviews - Admin
  app.put("/api/admin/products/reviews/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { approved } = req.body;
      const review = await storage.updateProductReview(req.params.id, { approved });
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/admin/products/reviews/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteProductReview(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Related Products
  app.get("/api/products/:id/related", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      const related = await storage.getRelatedProducts(req.params.id, product.categoryId);
      res.json(related);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch related products" });
    }
  });

  app.delete("/api/admin/products/:idOrSlug", requireAuth, async (req: Request, res: Response) => {
    try {
      const product = await storage.getProductByIdOrSlug(req.params.idOrSlug);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      
      await storage.deleteProduct(product.id);
      
      // Invalidate cache
      cache.del(CACHE_KEYS.PRODUCTS_LIST);
      cache.del(`${CACHE_KEYS.PRODUCTS_LIST}_${product.categoryId}`);
      cache.del(CACHE_KEYS.SITEMAP);
      
      res.status(204).send();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete product";
      // If it's a validation error (has orders or campaigns), return 400
      if (errorMessage.includes("ordered") || errorMessage.includes("campaigns")) {
        res.status(400).json({ error: errorMessage });
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  app.get("/api/admin/categories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      // Tüm alanları explicit olarak döndür
      res.json({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? null,
        icon: category.icon ?? null,
        order: category.order ?? 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.get("/api/admin/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const hierarchical = req.query.hierarchical === "true";
      const mainOnly = req.query.main === "true" || req.query.parent === "null";
      const parentId = req.query.parent as string | undefined;
      
      // Ana kategorileri getir (parentId: null)
      if (mainOnly || parentId === "null") {
        const categories = await storage.getCategoriesByParent(null);
        // Tüm alanları explicit olarak döndür
        const formatted = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId ?? null,
          icon: cat.icon ?? null,
          order: cat.order ?? 0,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        }));
        res.json(formatted);
        return;
      }
      
      // Belirli bir parent'ın alt kategorilerini getir
      if (parentId) {
        const categories = await storage.getCategoriesByParent(parentId);
        const formatted = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId ?? null,
          icon: cat.icon ?? null,
          order: cat.order ?? 0,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        }));
        res.json(formatted);
        return;
      }
      
      // Hiyerarşik yapı
      if (hierarchical) {
        const categories = await storage.getCategoriesHierarchical();
        res.json(categories);
      } else {
        // Tüm kategoriler (düz liste) - Tüm alanları explicit olarak döndür
        const categories = await storage.getCategories();
        const formatted = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId ?? null,
          icon: cat.icon ?? null,
          order: cat.order ?? 0,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        }));
        res.json(formatted);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/admin/categories/hierarchical", requireAuth, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategoriesHierarchical();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/admin/categories/parent/:parentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const parentId = req.params.parentId === "null" ? null : req.params.parentId;
      const categories = await storage.getCategoriesByParent(parentId);
      // Tüm alanları explicit olarak döndür
      const formatted = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId ?? null,
        icon: cat.icon ?? null,
        order: cat.order ?? 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      }));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.put("/api/admin/categories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validated);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteCategory(req.params.id);
      // Invalidate cache
      cache.del(CACHE_KEYS.CATEGORIES);
      cache.del(`${CACHE_KEYS.CATEGORIES}_hierarchical`);
      res.status(204).send();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete category";
      // If it's a validation error (has child categories or products), return 400
      if (errorMessage.includes("child categories") || errorMessage.includes("products")) {
        res.status(400).json({ error: errorMessage });
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  app.get("/api/admin/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      // Fetch order items with product and internet package details for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          // Fetch product and internet package details for each item
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              if (item.productId) {
                const product = await storage.getProduct(item.productId);
                return { ...item, product, internetPackage: null };
              } else if (item.internetPackageId) {
                const internetPackage = await storage.getInternetPackage(item.internetPackageId);
                return { ...item, product: null, internetPackage };
              }
              return item;
            })
          );
          return { ...order, items: itemsWithDetails };
        })
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Orders - Public (for tracking)
  app.get("/api/orders/track/:phone", async (req: Request, res: Response) => {
    try {
      const phone = req.params.phone;
      const orders = await storage.getOrdersByPhone(phone);
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              if (item.productId) {
                const product = await storage.getProduct(item.productId);
                return { ...item, product, internetPackage: null };
              } else if (item.internetPackageId) {
                const internetPackage = await storage.getInternetPackage(item.internetPackageId);
                return { ...item, product: null, internetPackage };
              }
              return item;
            })
          );
          return { ...order, items: itemsWithDetails };
        })
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/track/:phone/:orderNumber", async (req: Request, res: Response) => {
    try {
      const phone = req.params.phone;
      const orderNumber = req.params.orderNumber;
      const order = await storage.getOrderByNumber(orderNumber);
      if (!order || order.customerPhone !== phone) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      const items = await storage.getOrderItems(order.id);
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          if (item.productId) {
            const product = await storage.getProduct(item.productId);
            return { ...item, product, internetPackage: null };
          } else if (item.internetPackageId) {
            const internetPackage = await storage.getInternetPackage(item.internetPackageId);
            return { ...item, product: null, internetPackage };
          }
          return item;
        })
      );
      res.json({ ...order, items: itemsWithDetails });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Orders - Create (Public, for checkout)
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const { order, items, internetPackages } = req.body;
      
      // En az bir item veya internet package olmalı
      const hasItems = items && Array.isArray(items) && items.length > 0;
      const hasInternetPackages = internetPackages && Array.isArray(internetPackages) && internetPackages.length > 0;
      
      if (!order || (!hasItems && !hasInternetPackages)) {
        res.status(400).json({ error: "Invalid order data: at least one item or internet package required" });
        return;
      }
      
      const validatedOrder = insertOrderSchema.parse(order);
      
      // Validate and combine items
      const allItems: any[] = [];
      
      if (hasItems) {
        // Validate that all products exist
        for (const item of items) {
          if (!item.productId) {
            res.status(400).json({ error: "Product ID is required for all items" });
            return;
          }
          const product = await storage.getProduct(item.productId);
          if (!product) {
            res.status(400).json({ error: `Product with ID ${item.productId} not found` });
            return;
          }
        }
        
        const validatedProductItems = items.map((item: any) => ({
          productId: item.productId,
          internetPackageId: null,
          quantity: parseInt(item.quantity),
          price: typeof item.price === 'number' ? item.price.toFixed(2) : item.price,
        }));
        allItems.push(...validatedProductItems);
      }
      
      if (hasInternetPackages) {
        // Validate that all internet packages exist
        for (const item of internetPackages) {
          if (!item.internetPackageId) {
            res.status(400).json({ error: "Internet package ID is required for all internet packages" });
            return;
          }
          const internetPackage = await storage.getInternetPackage(item.internetPackageId);
          if (!internetPackage) {
            res.status(400).json({ error: `Internet package with ID ${item.internetPackageId} not found` });
            return;
          }
        }
        
        const validatedInternetItems = internetPackages.map((item: any) => ({
          productId: null,
          internetPackageId: item.internetPackageId,
          quantity: parseInt(item.quantity),
          price: typeof item.price === 'number' ? item.price.toFixed(2) : item.price,
        }));
        allItems.push(...validatedInternetItems);
      }

      const newOrder = await storage.createOrder(validatedOrder, allItems);
      const orderItems = await storage.getOrderItems(newOrder.id);
      
      // Fetch products and internet packages for response
      const itemsWithDetails = await Promise.all(
        orderItems.map(async (item) => {
          if (item.productId) {
            const product = await storage.getProduct(item.productId);
            return { ...item, product, internetPackage: null };
          } else if (item.internetPackageId) {
            const internetPackage = await storage.getInternetPackage(item.internetPackageId);
            return { ...item, product: null, internetPackage };
          }
          return item;
        })
      );
      
      res.status(201).json({ ...newOrder, items: itemsWithDetails });
    } catch (error: any) {
      console.error("Order creation error:", error);
      if (error.errors) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(400).json({ error: error.message || "Invalid order data" });
      }
    }
  });

  app.put("/api/admin/orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: "Status required" });
        return;
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Internet Packages - Public
  app.get("/api/internet-packages", async (req: Request, res: Response) => {
    try {
      const packages = await storage.getInternetPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch internet packages" });
    }
  });

  // Internet Packages - Admin
  app.get("/api/admin/internet-packages", requireAuth, async (req: Request, res: Response) => {
    try {
      const packages = await storage.getInternetPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch internet packages" });
    }
  });

  app.get("/api/admin/internet-packages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const pkg = await storage.getInternetPackage(req.params.id);
      if (!pkg) {
        res.status(404).json({ error: "Internet package not found" });
        return;
      }
      res.json(pkg);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch internet package" });
    }
  });

  app.post("/api/admin/internet-packages", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Received internet package data:", JSON.stringify(req.body, null, 2));
      const validated = insertInternetPackageSchema.parse(req.body);
      console.log("Validated internet package data:", JSON.stringify(validated, null, 2));
      const pkg = await storage.createInternetPackage(validated);
      res.status(201).json(pkg);
    } catch (error: any) {
      console.error("Internet package creation error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: `Validation error: ${errorMessages}`, details: error.errors });
      } else {
        res.status(400).json({ error: error.message || "Invalid internet package data", details: error });
      }
    }
  });

  app.put("/api/admin/internet-packages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Received internet package update data:", JSON.stringify(req.body, null, 2));
      const validated = insertInternetPackageSchema.partial().parse(req.body);
      console.log("Validated internet package update data:", JSON.stringify(validated, null, 2));
      const pkg = await storage.updateInternetPackage(req.params.id, validated);
      res.json(pkg);
    } catch (error: any) {
      console.error("Internet package update error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: `Validation error: ${errorMessages}`, details: error.errors });
      } else {
        res.status(400).json({ error: error.message || "Invalid internet package data", details: error });
      }
    }
  });

  app.delete("/api/admin/internet-packages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const pkg = await storage.getInternetPackage(req.params.id);
      if (!pkg) {
        res.status(404).json({ error: "Internet package not found" });
        return;
      }
      
      await storage.deleteInternetPackage(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete internet package";
      // If it's a validation error (has orders), return 400
      if (errorMessage.includes("ordered")) {
        res.status(400).json({ error: errorMessage });
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  // Repair Services - Public
  app.get("/api/repair-services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getRepairServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repair services" });
    }
  });

  // Public upload endpoint for repair request images
  app.post("/api/repair-requests/upload", upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
  });

  // Repair Requests - Public
  app.post("/api/repair-requests", async (req: Request, res: Response) => {
    try {
      const { randomUUID } = await import("crypto");
      // Generate unique tracking number
      const trackingNumber = "TR" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const { images, ...requestData } = req.body;
      
      const validated = insertRepairRequestSchema.parse({
        ...requestData,
        trackingNumber,
        status: "pending",
      });
      const request = await storage.createRepairRequest(validated);
      
      // Save images if provided
      if (images && Array.isArray(images) && images.length > 0) {
        const imagePromises = images.map((imageUrl: string, index: number) =>
          storage.createRepairRequestImage({
            repairRequestId: request.id,
            imageUrl,
            description: null,
            order: index,
          })
        );
        await Promise.all(imagePromises);
      }
      
      res.status(201).json(request);
    } catch (error: any) {
      console.error("Error creating repair request:", error);
      res.status(400).json({ error: error.message || "Invalid repair request data" });
    }
  });

  app.get("/api/repair-requests/track/:trackingNumber", async (req: Request, res: Response) => {
    try {
      const request = await storage.getRepairRequestByTrackingNumber(req.params.trackingNumber);
      if (!request) {
        res.status(404).json({ error: "Repair request not found" });
        return;
      }
      const images = await storage.getRepairRequestImages(request.id);
      res.json({ ...request, images });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repair request" });
    }
  });

  app.get("/api/repair-requests/:id/images", async (req: Request, res: Response) => {
    try {
      const images = await storage.getRepairRequestImages(req.params.id);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/repair-requests/:trackingNumber/approve", async (req: Request, res: Response) => {
    try {
      const request = await storage.getRepairRequestByTrackingNumber(req.params.trackingNumber);
      if (!request) {
        res.status(404).json({ error: "Repair request not found" });
        return;
      }
      const { approved } = req.body;
      const updated = await storage.updateRepairRequest(request.id, {
        customerApproved: approved === true,
        approvedAt: approved === true ? new Date() : null,
        status: approved === true ? "customer_approved" : "customer_rejected",
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update approval status" });
    }
  });

  app.get("/api/slides", async (req: Request, res: Response) => {
    try {
      const slides = await storage.getAllSlides();
      // Only return active slides
      const activeSlides = slides.filter((slide) => slide.active);
      res.json(activeSlides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  // Repair Services - Admin
  app.get("/api/admin/repair-services", requireAuth, async (req: Request, res: Response) => {
    try {
      const services = await storage.getRepairServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repair services" });
    }
  });

  app.get("/api/admin/repair-services/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const service = await storage.getRepairService(req.params.id);
      if (!service) {
        res.status(404).json({ error: "Repair service not found" });
        return;
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repair service" });
    }
  });

  app.post("/api/admin/repair-services", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertRepairServiceSchema.parse(req.body);
      const service = await storage.createRepairService(validated);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ error: "Invalid repair service data" });
    }
  });

  app.put("/api/admin/repair-services/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertRepairServiceSchema.partial().parse(req.body);
      const service = await storage.updateRepairService(req.params.id, validated);
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: "Invalid repair service data" });
    }
  });

  app.delete("/api/admin/repair-services/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteRepairService(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete repair service" });
    }
  });

  // Repair Requests - Admin
  app.get("/api/admin/repair-requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getRepairRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repair requests" });
    }
  });

  app.get("/api/admin/repair-requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const request = await storage.getRepairRequest(req.params.id);
      if (!request) {
        res.status(404).json({ error: "Repair request not found" });
        return;
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repair request" });
    }
  });

  app.post("/api/admin/repair-requests", requireAuth, async (req: Request, res: Response) => {
    try {
      // Generate unique tracking number
      const trackingNumber = "TR" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const { images, ...requestData } = req.body;
      
      const validated = insertRepairRequestSchema.parse({
        ...requestData,
        trackingNumber,
        status: requestData.status || "pending",
      });
      const request = await storage.createRepairRequest(validated);
      
      // Save images if provided
      if (images && Array.isArray(images) && images.length > 0) {
        const imagePromises = images.map((imageUrl: string, index: number) =>
          storage.createRepairRequestImage({
            repairRequestId: request.id,
            imageUrl,
            description: null,
            order: index,
          })
        );
        await Promise.all(imagePromises);
      }
      
      res.status(201).json(request);
    } catch (error: any) {
      console.error("Error creating repair request:", error);
      res.status(400).json({ error: error.message || "Invalid repair request data" });
    }
  });

  app.put("/api/admin/repair-requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertRepairRequestSchema.partial().parse(req.body);
      const request = await storage.updateRepairRequest(req.params.id, validated);
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid repair request data" });
    }
  });

  app.post("/api/admin/repair-requests/:id/quote-price", requireAuth, async (req: Request, res: Response) => {
    try {
      const { finalPrice, laborCost, partsCost, diagnosisNotes, repairItems } = req.body;
      if (!finalPrice) {
        res.status(400).json({ error: "Final price is required" });
        return;
      }
      const request = await storage.getRepairRequest(req.params.id);
      if (!request) {
        res.status(404).json({ error: "Repair request not found" });
        return;
      }
      const updateData: any = {
        finalPrice: finalPrice.toString(),
        diagnosisNotes: diagnosisNotes || request.diagnosisNotes,
        status: "price_quoted",
        customerApproved: null,
        approvedAt: null,
      };
      if (laborCost !== undefined) {
        updateData.laborCost = laborCost.toString();
      }
      if (partsCost !== undefined) {
        updateData.partsCost = partsCost.toString();
      }
      if (repairItems !== undefined) {
        updateData.repairItems = typeof repairItems === "string" ? repairItems : JSON.stringify(repairItems);
      }
      const updated = await storage.updateRepairRequest(req.params.id, updateData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to quote price" });
    }
  });

  app.post("/api/admin/repair-requests/:id/update-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status, repairNotes, repairItems } = req.body;
      if (!status) {
        res.status(400).json({ error: "Status is required" });
        return;
      }
      const updateData: any = { status };
      if (repairNotes !== undefined) {
        updateData.repairNotes = repairNotes;
      }
      if (repairItems !== undefined) {
        updateData.repairItems = typeof repairItems === "string" ? repairItems : JSON.stringify(repairItems);
      }
      if (status === "completed") {
        updateData.completedAt = new Date().toISOString();
      }
      if (status === "delivered") {
        updateData.deliveredAt = new Date().toISOString();
      }
      const request = await storage.updateRepairRequest(req.params.id, updateData);
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update status" });
    }
  });

  // Repair Request Images - Admin
  app.get("/api/admin/repair-requests/:id/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const images = await storage.getRepairRequestImages(req.params.id);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/admin/repair-requests/:id/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const { imageUrl, description, order } = req.body;
      if (!imageUrl) {
        res.status(400).json({ error: "Image URL is required" });
        return;
      }
      const image = await storage.createRepairRequestImage({
        repairRequestId: req.params.id,
        imageUrl,
        description: description || null,
        order: order || 0,
      });
      res.status(201).json(image);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to add image" });
    }
  });

  app.delete("/api/admin/repair-requests/images/:imageId", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteRepairRequestImage(req.params.imageId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  app.delete("/api/admin/repair-requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteRepairRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete repair request" });
    }
  });

  // Customers - Admin (from repair requests)
  app.get("/api/admin/customers", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("[API] /api/admin/customers - Request received");
      const customers = await storage.getCustomers();
      console.log(`[API] /api/admin/customers - Found ${customers.length} customers`);
      res.setHeader("Content-Type", "application/json");
      res.json(customers);
    } catch (error: any) {
      console.error("[API] /api/admin/customers - Error:", error);
      res.setHeader("Content-Type", "application/json");
      res.status(500).json({ error: error.message || "Failed to fetch customers" });
    }
  });

  app.get("/api/admin/customers/:phone", requireAuth, async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomerByPhone(req.params.phone);
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      const repairRequests = await storage.getRepairRequestsByCustomerPhone(req.params.phone);
      res.json({ ...customer, repairRequests });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Slides - Admin
  app.get("/api/admin/slides", requireAuth, async (req: Request, res: Response) => {
    try {
      const slides = await storage.getAllSlides();
      res.json(slides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  app.post("/api/admin/slides", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertSlideSchema.parse(req.body);
      const slide = await storage.createSlide(validated);
      res.status(201).json(slide);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create slide" });
    }
  });

  app.put("/api/admin/slides/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertSlideSchema.partial().parse(req.body);
      const slide = await storage.updateSlide(req.params.id, validated);
      res.json(slide);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update slide" });
    }
  });

  app.delete("/api/admin/slides/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteSlide(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete slide" });
    }
  });

  // Blog Posts - Public
  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // If pagination params are provided, use pagination
      if (page && limit) {
        const result = await storage.getBlogPostsPaginated(page, limit, true); // Only published
        return res.json(result);
      }
      
      // Otherwise, return all posts
      const posts = await storage.getBlogPosts(true); // Only published
      res.json(posts || []);
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts", details: error.message });
    }
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || !post.published) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  // Blog Posts - Admin
  app.get("/api/admin/blog", requireAuth, async (req: Request, res: Response) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/admin/blog/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  app.post("/api/admin/blog", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validated);
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create blog post" });
    }
  });

  app.put("/api/admin/blog/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertBlogPostSchema.partial().parse(req.body);
      const post = await storage.updateBlogPost(req.params.id, validated);
      
      // Invalidate cache
      cache.del(CACHE_KEYS.SITEMAP);
      
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Exchange Rate - Public
  app.get("/api/exchange-rate", async (req: Request, res: Response) => {
    try {
      const rate = await getUSDExchangeRate();
      res.json({ 
        usdToTry: rate,
        currency: "USD",
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch exchange rate" });
    }
  });

  // Settings - Public (read-only)
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      // Check cache
      const cached = cache.get(CACHE_KEYS.SETTINGS);
      if (cached) {
        return res.json(cached);
      }
      
      const settings = await storage.getSettings();
      
      // Cache for 1 hour
      cache.set(CACHE_KEYS.SETTINGS, settings, 3600);
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        res.status(404).json({ error: "Setting not found" });
        return;
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // Settings - Admin
  app.get("/api/admin/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertSettingSchema.parse(req.body);
      const setting = await storage.setSetting(validated);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  app.put("/api/admin/settings/:key", requireAuth, async (req: Request, res: Response) => {
    try {
      const { value, type } = req.body;
      // Boş string değerleri kabul et (null veya undefined değilse)
      if (value === undefined || value === null) {
        res.status(400).json({ error: "Value required" });
        return;
      }
      // String'e çevir (number type için bile)
      const stringValue = String(value);
      // setSetting kullan (yoksa oluşturur, varsa günceller)
      const setting = await storage.setSetting({
        key: req.params.key,
        value: stringValue,
        type: type || "text",
      });
      res.json(setting);
    } catch (error) {
      console.error("Setting update error:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Shipping Regions - Admin
  app.get("/api/admin/shipping-regions", requireAuth, async (req: Request, res: Response) => {
    try {
      const regions = await storage.getShippingRegions();
      res.json(regions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipping regions" });
    }
  });

  app.get("/api/admin/shipping-regions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const region = await storage.getShippingRegion(req.params.id);
      if (!region) {
        res.status(404).json({ error: "Shipping region not found" });
        return;
      }
      res.json(region);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipping region" });
    }
  });

  app.post("/api/admin/shipping-regions", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertShippingRegionSchema.parse(req.body);
      const region = await storage.createShippingRegion(validated);
      res.status(201).json(region);
    } catch (error: any) {
      console.error("Shipping region creation error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: `Validation error: ${errorMessages}`, details: error.errors });
      } else {
        res.status(400).json({ error: error.message || "Invalid shipping region data", details: error });
      }
    }
  });

  app.put("/api/admin/shipping-regions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertShippingRegionSchema.partial().parse(req.body);
      const region = await storage.updateShippingRegion(req.params.id, validated);
      res.json(region);
    } catch (error: any) {
      console.error("Shipping region update error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: `Validation error: ${errorMessages}`, details: error.errors });
      } else {
        res.status(400).json({ error: error.message || "Invalid shipping region data", details: error });
      }
    }
  });

  app.delete("/api/admin/shipping-regions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteShippingRegion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shipping region" });
    }
  });

  // Shipping Cost - Public (for checkout)
  app.get("/api/shipping-cost", async (req: Request, res: Response) => {
    try {
      const { city, subtotal } = req.query;
      if (!city || typeof city !== 'string') {
        res.status(400).json({ error: "City is required" });
        return;
      }

      const shippingCost = await storage.getShippingCostByCity(city);
      
      // Ücretsiz kargo eşiği kontrolü
      const freeShippingThreshold = await storage.getSetting("free_shipping_threshold");
      const threshold = freeShippingThreshold ? parseFloat(freeShippingThreshold.value || "0") : 0;
      const subtotalNum = subtotal ? parseFloat(subtotal as string) : 0;
      
      const finalCost = subtotalNum >= threshold ? 0 : shippingCost;
      
      res.json({ cost: finalCost, freeShippingThreshold: threshold });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate shipping cost" });
    }
  });

  // Sitemap
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    try {
      // Check cache
      const cached = cache.get(CACHE_KEYS.SITEMAP);
      if (cached) {
        res.setHeader("Content-Type", "application/xml");
        return res.send(cached);
      }
      
      const baseUrl = env.VITE_PUBLIC_URL || `http://${req.get("host")}`;
      
      const [products, categories, blogPosts] = await Promise.all([
        storage.getProducts(),
        storage.getCategories(),
        storage.getBlogPosts(true), // Only published blog posts
      ]);

      interface SitemapUrl {
        loc: string;
        lastmod?: string;
        changefreq: string;
        priority: string;
        images?: Array<{ loc: string; title?: string; caption?: string }>;
      }

      const urls: SitemapUrl[] = [];

      // Static pages
      urls.push({
        loc: `${baseUrl}/`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0',
      });

      urls.push({
        loc: `${baseUrl}/products`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.9',
      });

      urls.push({
        loc: `${baseUrl}/about`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      });

      urls.push({
        loc: `${baseUrl}/contact`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      });

      urls.push({
        loc: `${baseUrl}/blog`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
      });

      urls.push({
        loc: `${baseUrl}/repair`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7',
      });

      // Add product URLs with images
      products.forEach((product) => {
        const productUrl = product.slug 
          ? `${baseUrl}/product/${product.slug}`
          : `${baseUrl}/product/${product.id}`;
        
        const images: Array<{ loc: string; title?: string; caption?: string }> = [];
        if (product.image) {
          const imageUrl = product.image.startsWith('http') 
            ? product.image 
            : `${baseUrl}${product.image}`;
          images.push({
            loc: imageUrl,
            title: product.title,
            caption: product.description || product.title,
          });
        }
        if (product.ogImage && product.ogImage !== product.image) {
          const ogImageUrl = product.ogImage.startsWith('http')
            ? product.ogImage
            : `${baseUrl}${product.ogImage}`;
          images.push({
            loc: ogImageUrl,
            title: product.title,
          });
        }

        const lastmod = product.updatedAt 
          ? new Date(product.updatedAt).toISOString().split('T')[0]
          : product.createdAt 
            ? new Date(product.createdAt).toISOString().split('T')[0]
            : undefined;

        urls.push({
          loc: productUrl,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8',
          images: images.length > 0 ? images : undefined,
        });
      });

      // Add category URLs
      categories.forEach((category) => {
        const lastmod = category.updatedAt
          ? new Date(category.updatedAt).toISOString().split('T')[0]
          : category.createdAt
            ? new Date(category.createdAt).toISOString().split('T')[0]
            : undefined;

        urls.push({
          loc: `${baseUrl}/categories/${category.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.6',
        });
      });

      // Add blog post URLs with images
      blogPosts.forEach((post) => {
        if (post.published) {
          const images: Array<{ loc: string; title?: string; caption?: string }> = [];
          if (post.featuredImage) {
            const imageUrl = post.featuredImage.startsWith('http')
              ? post.featuredImage
              : `${baseUrl}${post.featuredImage}`;
            images.push({
              loc: imageUrl,
              title: post.title,
              caption: post.excerpt || post.title,
            });
          }

          const lastmod = post.modifiedAt
            ? new Date(post.modifiedAt).toISOString().split('T')[0]
            : post.updatedAt
              ? new Date(post.updatedAt).toISOString().split('T')[0]
              : post.publishedAt
                ? new Date(post.publishedAt).toISOString().split('T')[0]
                : undefined;

          urls.push({
            loc: `${baseUrl}/blog/${post.slug}`,
            lastmod,
            changefreq: 'monthly',
            priority: '0.7',
            images: images.length > 0 ? images : undefined,
          });
        }
      });

      // Generate XML with image support
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map((url) => {
    let urlXml = `  <url>
    <loc>${url.loc}</loc>`;
    
    if (url.lastmod) {
      urlXml += `\n    <lastmod>${url.lastmod}</lastmod>`;
    }
    
    urlXml += `\n    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>`;
    
    if (url.images && url.images.length > 0) {
      url.images.forEach((image) => {
        urlXml += `\n    <image:image>`;
        urlXml += `\n      <image:loc>${image.loc}</image:loc>`;
        if (image.title) {
          urlXml += `\n      <image:title>${image.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>`;
        }
        if (image.caption) {
          urlXml += `\n      <image:caption>${image.caption.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:caption>`;
        }
        urlXml += `\n    </image:image>`;
      });
    }
    
    urlXml += `\n  </url>`;
    return urlXml;
  })
  .join("\n")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      
      // Cache sitemap for 5 minutes
      cache.set(CACHE_KEYS.SITEMAP, sitemap, 300);
      
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  // Robots.txt
  app.get("/robots.txt", async (req: Request, res: Response) => {
      const baseUrl = env.VITE_PUBLIC_URL || `http://${req.get("host")}`;
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.setHeader("Content-Type", "text/plain");
    res.send(robots);
  });

  // Image Upload Endpoint
  // Newsletter Subscriptions
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const validated = insertNewsletterSubscriptionSchema.parse(req.body);
      const subscription = await storage.createNewsletterSubscription(validated);
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid subscription data" });
    }
  });

  app.post("/api/newsletter/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { email, phone } = req.body;
      await storage.unsubscribeNewsletter(email, phone);
      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Newsletter - Admin
  app.get("/api/admin/newsletter", requireAuth, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getNewsletterSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch newsletter subscriptions" });
    }
  });

  app.delete("/api/admin/newsletter/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteNewsletterSubscription(req.params.id);
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // Campaigns - Public (get active campaign)
  app.get("/api/campaigns/active", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const campaign = await storage.getActiveCampaign(type);
      if (!campaign) {
        res.json(null);
        return;
      }
      const products = await storage.getCampaignProducts(campaign.id);
      res.json({ ...campaign, products });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active campaign" });
    }
  });

  // Campaigns - Admin
  app.get("/api/admin/campaigns", requireAuth, async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/admin/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }
      const products = await storage.getCampaignProducts(campaign.id);
      res.json({ ...campaign, products });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/admin/campaigns", requireAuth, async (req: Request, res: Response) => {
    try {
      const { insertCampaignSchema } = await import("@shared/schema");
      const validated = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validated);
      res.status(201).json(campaign);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid campaign data" });
    }
  });

  app.put("/api/admin/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { insertCampaignSchema } = await import("@shared/schema");
      const validated = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(req.params.id, validated);
      res.json(campaign);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid campaign data" });
    }
  });

  app.delete("/api/admin/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // Campaign Products - Admin
  app.post("/api/admin/campaigns/:id/products", requireAuth, async (req: Request, res: Response) => {
    try {
      const { productId, order, specialPrice } = req.body;
      
      // Validate campaign exists
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }
      
      // Validate product exists
      if (!productId) {
        res.status(400).json({ error: "Product ID is required" });
        return;
      }
      const product = await storage.getProduct(productId);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      
      const campaignProduct = await storage.addProductToCampaign(
        req.params.id,
        productId,
        order || 0,
        specialPrice || null
      );
      res.status(201).json(campaignProduct);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to add product to campaign" });
    }
  });

  app.delete("/api/admin/campaigns/:id/products/:productId", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.removeProductFromCampaign(req.params.id, req.params.productId);
      res.json({ message: "Product removed from campaign" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove product from campaign" });
    }
  });

  app.put("/api/admin/campaigns/:id/products/:productId/order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { order } = req.body;
      await storage.updateCampaignProductOrder(req.params.id, req.params.productId, order);
      res.json({ message: "Product order updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product order" });
    }
  });

  // Contact Messages - Public
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const validated = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validated);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid contact message data" });
    }
  });

  // Contact Messages - Admin
  app.get("/api/admin/contact-messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact messages" });
    }
  });

  app.get("/api/admin/contact-messages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const message = await storage.getContactMessage(req.params.id);
      if (!message) {
        res.status(404).json({ error: "Message not found" });
        return;
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  app.put("/api/admin/contact-messages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertContactMessageSchema.partial().parse(req.body);
      const message = await storage.updateContactMessage(req.params.id, validated);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid message data" });
    }
  });

  app.delete("/api/admin/contact-messages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteContactMessage(req.params.id);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // FAQs - Public
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const active = req.query.active === "true" ? true : req.query.active === "false" ? false : undefined;
      const faqs = await storage.getFAQs(active);
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // FAQs - Admin
  app.get("/api/admin/faqs", requireAuth, async (req: Request, res: Response) => {
    try {
      const faqs = await storage.getFAQs();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/admin/faqs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const faq = await storage.getFAQ(req.params.id);
      if (!faq) {
        res.status(404).json({ error: "FAQ not found" });
        return;
      }
      res.json(faq);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQ" });
    }
  });

  app.post("/api/admin/faqs", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertFAQSchema.parse(req.body);
      const faq = await storage.createFAQ(validated);
      res.status(201).json(faq);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid FAQ data" });
    }
  });

  app.put("/api/admin/faqs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertFAQSchema.partial().parse(req.body);
      const faq = await storage.updateFAQ(req.params.id, validated);
      res.json(faq);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid FAQ data" });
    }
  });

  app.delete("/api/admin/faqs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteFAQ(req.params.id);
      res.json({ message: "FAQ deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  app.post("/api/admin/upload", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Dosya yüklenmedi" });
        return;
      }

      // Optimize image if it's an image file
      const filePath = path.join(process.cwd(), "client", "public", "uploads", req.file.filename);
      const optimizedPath = await optimizeUploadedImage(filePath);
      const optimizedFilename = path.basename(optimizedPath);
      const fileUrl = `/uploads/${optimizedFilename}`;
      
      res.json({ url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Dosya yüklenemedi" });
    }
  });

  // Analytics / Page Views - Public endpoint to track page views
  app.post("/api/analytics/pageview", async (req: Request, res: Response) => {
    try {
      const { path: pagePath, referrer, userAgent, sessionId } = req.body;
      
      if (!pagePath) {
        res.status(400).json({ error: "Path is required" });
        return;
      }

      // Get IP address from request
      const ipAddress = req.ip || req.socket.remoteAddress || 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
        'unknown';

      const pageView = await storage.createPageView({
        path: pagePath,
        referrer: referrer || null,
        userAgent: userAgent || req.headers['user-agent'] || null,
        ipAddress: ipAddress,
        sessionId: sessionId || null,
      });

      res.status(201).json({ success: true, id: pageView.id });
    } catch (error: any) {
      console.error("Error tracking page view:", error);
      res.status(500).json({ error: error.message || "Failed to track page view" });
    }
  });

  // Analytics - Admin endpoints
  app.get("/api/admin/analytics/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period, limit } = req.query;
      const validPeriods = ["day", "week", "month"];
      const statsPeriod = validPeriods.includes(period as string) 
        ? (period as "day" | "week" | "month") 
        : "day";
      
      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      const validLimit = isNaN(limitNum) || limitNum < 1 ? 10 : Math.min(limitNum, 100); // Max 100

      const stats = await storage.getPageViewStats(statsPeriod, validLimit);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching analytics stats:", error);
      res.status(500).json({ error: error.message || "Failed to fetch analytics stats" });
    }
  });

  app.get("/api/admin/analytics/stats/all", requireAuth, async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      const validLimit = isNaN(limitNum) || limitNum < 1 ? 10 : Math.min(limitNum, 100); // Max 100

      const [dayStats, weekStats, monthStats] = await Promise.all([
        storage.getPageViewStats("day", validLimit),
        storage.getPageViewStats("week", validLimit),
        storage.getPageViewStats("month", validLimit),
      ]);

      res.json({
        day: dayStats,
        week: weekStats,
        month: monthStats,
      });
    } catch (error: any) {
      console.error("Error fetching all analytics stats:", error);
      res.status(500).json({ error: error.message || "Failed to fetch analytics stats" });
    }
  });

  app.get("/api/admin/analytics/pageviews", requireAuth, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          res.status(400).json({ error: "Invalid startDate format" });
          return;
        }
      }

      if (endDate) {
        end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          res.status(400).json({ error: "Invalid endDate format" });
          return;
        }
      }

      const views = await storage.getPageViews(start, end);
      res.json(views);
    } catch (error: any) {
      console.error("Error fetching page views:", error);
      res.status(500).json({ error: error.message || "Failed to fetch page views" });
    }
  });

  return httpServer;
}
