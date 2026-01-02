import { eq, desc, sql, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type InternetPackage,
  type InsertInternetPackage,
  type RepairService,
  type InsertRepairService,
  type RepairRequest,
  type InsertRepairRequest,
  type RepairRequestImage,
  type InsertRepairRequestImage,
  type Slide,
  type InsertSlide,
  type BlogPost,
  type InsertBlogPost,
  type Setting,
  type InsertSetting,
  type ShippingRegion,
  type InsertShippingRegion,
  type ProductImage,
  type InsertProductImage,
  type ProductReview,
  type InsertProductReview,
  type NewsletterSubscription,
  type InsertNewsletterSubscription,
  type Campaign,
  type InsertCampaign,
  type CampaignProduct,
  type InsertCampaignProduct,
  type ContactMessage,
  type InsertContactMessage,
  type FAQ,
  type InsertFAQ,
  type PageView,
  type InsertPageView,
  users,
  categories,
  products,
  orders,
  orderItems,
  internetPackages,
  repairServices,
  repairRequests,
  repairRequestImages,
  slides,
  blogPosts,
  settings,
  shippingRegions,
  productImages,
  productReviews,
  newsletterSubscriptions,
  campaigns,
  campaignProducts,
  contactMessages,
  faqs,
  pageViews,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser & { password?: string }>): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoriesHierarchical(): Promise<Array<Category & { children?: Category[]; productCount?: number }>>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoriesByParent(parentId: string | null): Promise<Category[]>;
  getCategoryProductCount(categoryId: string): Promise<number>;
  getCategoryProductCounts(): Promise<Map<string, number>>;
  getCategoryTotalProductCount(categoryId: string, productCounts: Map<string, number>): Promise<number>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Products
  getProducts(categoryId?: string): Promise<Product[]>;
  getProductsPaginated(page: number, limit: number, categoryId?: string): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductByIdOrSlug(idOrSlug: string): Promise<Product | undefined>;
  getRelatedProducts(productId: string, categoryId: string, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Product Images
  getProductImages(productId: string): Promise<ProductImage[]>;
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  updateProductImage(id: string, image: Partial<InsertProductImage>): Promise<ProductImage>;
  deleteProductImage(id: string): Promise<void>;
  
  // Product Reviews
  getProductReviews(productId: string, approved?: boolean): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: string, review: Partial<InsertProductReview>): Promise<ProductReview>;
  deleteProductReview(id: string): Promise<void>;
  getProductAverageRating(productId: string): Promise<{ average: number; count: number }>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrdersByPhone(phone: string): Promise<Order[]>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  generateOrderNumber(): Promise<string>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Internet Packages
  getInternetPackages(): Promise<InternetPackage[]>;
  getInternetPackage(id: string): Promise<InternetPackage | undefined>;
  createInternetPackage(pkg: InsertInternetPackage): Promise<InternetPackage>;
  updateInternetPackage(id: string, pkg: Partial<InsertInternetPackage>): Promise<InternetPackage>;
  deleteInternetPackage(id: string): Promise<void>;

  // Repair Services
  getRepairServices(): Promise<RepairService[]>;
  getRepairService(id: string): Promise<RepairService | undefined>;
  createRepairService(service: InsertRepairService): Promise<RepairService>;
  updateRepairService(id: string, service: Partial<InsertRepairService>): Promise<RepairService>;
  deleteRepairService(id: string): Promise<void>;

  // Repair Requests
  getRepairRequests(): Promise<RepairRequest[]>;
  getRepairRequest(id: string): Promise<RepairRequest | undefined>;
  getRepairRequestByTrackingNumber(trackingNumber: string): Promise<RepairRequest | undefined>;
  getRepairRequestsByCustomerPhone(customerPhone: string): Promise<RepairRequest[]>;
  createRepairRequest(request: InsertRepairRequest): Promise<RepairRequest>;
  updateRepairRequest(id: string, request: Partial<InsertRepairRequest>): Promise<RepairRequest>;
  deleteRepairRequest(id: string): Promise<void>;
  
  // Repair Request Images
  getRepairRequestImages(repairRequestId: string): Promise<RepairRequestImage[]>;
  createRepairRequestImage(image: InsertRepairRequestImage): Promise<RepairRequestImage>;
  deleteRepairRequestImage(id: string): Promise<void>;

  // Customers (from repair requests)
  getCustomers(): Promise<Array<{ phone: string; name: string; email: string | null; totalRepairs: number; lastRepairDate: string | null }>>;
  getCustomerByPhone(phone: string): Promise<{ phone: string; name: string; email: string | null; totalRepairs: number; lastRepairDate: string | null } | undefined>;

  // Slides
  getAllSlides(): Promise<Slide[]>;
  getSlide(id: string): Promise<Slide | undefined>;
  createSlide(slide: InsertSlide): Promise<Slide>;
  updateSlide(id: string, slide: Partial<InsertSlide>): Promise<Slide>;
  deleteSlide(id: string): Promise<void>;

  // Blog Posts
  getBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPostsPaginated(page: number, limit: number, published?: boolean): Promise<{ posts: BlogPost[]; total: number; page: number; limit: number; totalPages: number }>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting>;
  
  // Newsletter Subscriptions
  getNewsletterSubscriptions(): Promise<NewsletterSubscription[]>;
  createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  unsubscribeNewsletter(email?: string, phone?: string): Promise<void>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getActiveCampaign(type?: string): Promise<Campaign | undefined>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  
  // Campaign Products
  getCampaignProducts(campaignId: string): Promise<Array<CampaignProduct & { product?: Product }>>;
  addProductToCampaign(campaignId: string, productId: string, order?: number, specialPrice?: string | null): Promise<CampaignProduct>;
  removeProductFromCampaign(campaignId: string, productId: string): Promise<void>;
  updateCampaignProductOrder(campaignId: string, productId: string, order: number): Promise<void>;

  // Contact Messages
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: string, message: Partial<InsertContactMessage>): Promise<ContactMessage>;
  deleteContactMessage(id: string): Promise<void>;

  // FAQs
  getFAQs(active?: boolean): Promise<FAQ[]>;
  getFAQ(id: string): Promise<FAQ | undefined>;
  createFAQ(faq: InsertFAQ): Promise<FAQ>;
  updateFAQ(id: string, faq: Partial<InsertFAQ>): Promise<FAQ>;
  deleteFAQ(id: string): Promise<void>;
  
  // Analytics / Page Views
  createPageView(view: InsertPageView): Promise<PageView>;
  getPageViews(startDate?: Date, endDate?: Date): Promise<PageView[]>;
  getUniqueVisitors(startDate?: Date, endDate?: Date): Promise<number>;
  getPageViewStats(period: "day" | "week" | "month", limit?: number): Promise<{
    total: number;
    unique: number;
    topPages: Array<{ path: string; count: number }>;
    totalPages: number;
  }>;
}

export class MySQLStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("[STORAGE] Searching for user:", username);
      const result = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      console.log("[STORAGE] Query result:", result.length, "users found");
      if (result.length > 0) {
        console.log("[STORAGE] User found:", result[0].username);
      }
      return result[0];
    } catch (error: any) {
      console.error("[STORAGE] getUserByUsername error:", error.message);
      console.error("[STORAGE] Error name:", error.name);
      console.error("[STORAGE] Error code:", error.code);
      if (error.sql) {
        console.error("[STORAGE] SQL:", error.sql);
      }
      console.error("[STORAGE] Error stack:", error.stack);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await import("bcryptjs").then(m => m.default.hash(insertUser.password, 10));
    const result = await db.insert(users).values({ ...insertUser, password: hashedPassword });
    // MySQL returns insertId differently, need to fetch the created user
    const allUsers = await db.select().from(users).where(eq(users.username, insertUser.username)).limit(1);
    return allUsers[0];
  }

  async updateUser(id: string, userData: Partial<InsertUser & { password?: string }>): Promise<User> {
    const updateData: any = {};
    
    if (userData.username) updateData.username = userData.username;
    if (userData.role) updateData.role = userData.role;
    
    // Password güncellemesi için hash'le
    if (userData.password) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.default.hash(userData.password, 10);
    }
    
    await db.update(users).set(updateData).where(eq(users.id, id));
    const [updated] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return updated;
  }

  // Categories
  async getCategoryProductCount(categoryId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    return Number(result[0]?.count || 0);
  }

  async getCategoryProductCounts(): Promise<Map<string, number>> {
    const productCountsResult = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .groupBy(products.categoryId);
    
    const productCounts = new Map<string, number>();
    for (const row of productCountsResult) {
      productCounts.set(row.categoryId, Number(row.count || 0));
    }
    return productCounts;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.order, categories.name);
  }

  async getCategoriesHierarchical(): Promise<Array<Category & { children?: Category[]; productCount?: number }>> {
    const allCategories = await db.select().from(categories).orderBy(categories.order, categories.name);
    
    // Get product counts for all categories in a single query
    const productCountsResult = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`,
      })
      .from(products)
      .groupBy(products.categoryId);
    
    const productCounts = new Map<string, number>();
    for (const row of productCountsResult) {
      productCounts.set(row.categoryId, Number(row.count || 0));
    }
    
    // Set 0 for categories with no products
    for (const category of allCategories) {
      if (!productCounts.has(category.id)) {
        productCounts.set(category.id, 0);
      }
    }
    
    // Create a map for quick lookup
    const categoryMap = new Map<string, Category & { children?: Category[]; productCount?: number }>();
    const rootCategories: Array<Category & { children?: Category[]; productCount?: number }> = [];
    
    // First pass: create all category objects with product counts
    for (const category of allCategories) {
      const productCount = productCounts.get(category.id) || 0;
      categoryMap.set(category.id, { ...category, children: [], productCount });
    }
    
    // Second pass: build hierarchy
    for (const category of allCategories) {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (!category.parentId) {
        // Root category
        rootCategories.push(categoryWithChildren);
      } else {
        // Child category
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(categoryWithChildren);
        }
      }
    }
    
    // Third pass: Calculate total product counts for parent categories (including children)
    const calculateTotalProductCount = (cat: Category & { children?: Category[]; productCount?: number }): number => {
      let total = cat.productCount || 0;
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          total += calculateTotalProductCount(child);
        }
      }
      return total;
    };
    
    // Update product counts for root categories to include children totals
    for (const rootCat of rootCategories) {
      rootCat.productCount = calculateTotalProductCount(rootCat);
    }
    
    return rootCategories;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return result[0];
  }

  async getCategoriesByParent(parentId: string | null): Promise<Category[]> {
    if (parentId === null) {
      return await db.select().from(categories).where(isNull(categories.parentId)).orderBy(categories.order, categories.name);
    }
    return await db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(categories.order, categories.name);
  }

  async getCategoryTotalProductCount(categoryId: string, productCounts: Map<string, number>): Promise<number> {
    // Get direct product count
    let total = productCounts.get(categoryId) || 0;
    
    // Get all child categories
    const childCategories = await this.getCategoriesByParent(categoryId);
    
    // Recursively add child category product counts
    for (const child of childCategories) {
      total += await this.getCategoryTotalProductCount(child.id, productCounts);
    }
    
    return total;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    await db.insert(categories).values(category);
    const [newCategory] = await db.select().from(categories).where(eq(categories.slug, category.slug)).limit(1);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    await db.update(categories).set(category).where(eq(categories.id, id));
    const [updated] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category has child categories
    const childCategories = await this.getCategoriesByParent(id);
    if (childCategories.length > 0) {
      throw new Error("Cannot delete category: it has child categories. Please delete child categories first.");
    }
    
    // Check if category has products
    const categoryProducts = await this.getProducts(id);
    if (categoryProducts.length > 0) {
      throw new Error("Cannot delete category: it has products. Please delete or move products first.");
    }
    
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Products
  async getProducts(categoryId?: string): Promise<Product[]> {
    if (categoryId) {
      return await db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductsPaginated(page: number, limit: number, categoryId?: string): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(products);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
    
    if (categoryId) {
      query = query.where(eq(products.categoryId, categoryId)) as any;
      countQuery = countQuery.where(eq(products.categoryId, categoryId)) as any;
    }
    
    const [productsResult, countResult] = await Promise.all([
      query.orderBy(desc(products.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);
    
    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);
    
    return {
      products: productsResult,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return result[0];
  }

  // Optimized: Try slug first, then ID (single query attempt)
  async getProductByIdOrSlug(idOrSlug: string): Promise<Product | undefined> {
    if (!idOrSlug) {
      return undefined;
    }
    
    // First try as slug (most common case for SEO-friendly URLs)
    // Only search by slug if idOrSlug doesn't look like a UUID (UUIDs have dashes and are 36 chars)
    const isLikelySlug = !idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isLikelySlug) {
      try {
        const slugResult = await db.select().from(products).where(eq(products.slug, idOrSlug)).limit(1);
        if (slugResult.length > 0 && slugResult[0]) {
          return slugResult[0];
        }
      } catch (error) {
        // If slug search fails, continue to ID search
        console.warn("[STORAGE] Slug search failed, trying ID:", error);
      }
    }
    
    // If not found as slug, try as ID
    try {
      const idResult = await db.select().from(products).where(eq(products.id, idOrSlug)).limit(1);
      return idResult[0];
    } catch (error) {
      console.error("[STORAGE] ID search failed:", error);
      return undefined;
    }
  }

  async getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.categoryId} = ${categoryId} AND ${products.id} != ${productId} AND ${products.inStock} = true`)
      .limit(limit);
  }

  // Helper function to generate slug from title
  private generateSlug(title: string): string {
    const turkishCharMap: { [key: string]: string } = {
      ç: "c", Ç: "c",
      ğ: "g", Ğ: "g",
      ı: "i", İ: "i",
      ö: "o", Ö: "o",
      ş: "s", Ş: "s",
      ü: "u", Ü: "u",
    };

    return title
      .split("")
      .map((char) => turkishCharMap[char] || char)
      .join("")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Generate slug if not provided or empty string
    const productWithSlug = {
      ...product,
      slug: (product.slug && product.slug.trim()) ? product.slug : this.generateSlug(product.title),
    };
    
    await db.insert(products).values(productWithSlug);
    // Fetch by title as unique identifier (or use a better method)
    const allProducts = await db.select().from(products).where(eq(products.title, product.title)).limit(1);
    return allProducts[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    // Generate slug if title is updated but slug is not provided or is empty string
    const updateData: Partial<InsertProduct> = { ...product };
    if (product.title) {
      // If slug is not provided or is empty string, generate from title
      if (!product.slug || (typeof product.slug === 'string' && !product.slug.trim())) {
        updateData.slug = this.generateSlug(product.title);
      }
    }
    
    await db.update(products).set(updateData).where(eq(products.id, id));
    const [updated] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    // Check if product has order items
    const productOrderItems = await db.select().from(orderItems).where(eq(orderItems.productId, id)).limit(1);
    if (productOrderItems.length > 0) {
      throw new Error("Cannot delete product: it has been ordered. Products with orders cannot be deleted.");
    }
    
    // Check if product is in any campaigns
    const productCampaigns = await db.select().from(campaignProducts).where(eq(campaignProducts.productId, id)).limit(1);
    if (productCampaigns.length > 0) {
      throw new Error("Cannot delete product: it is in active campaigns. Please remove from campaigns first.");
    }
    
    // Delete related data first (cascade delete)
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(productReviews).where(eq(productReviews.productId, id));
    
    // Then delete the product
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    return result[0];
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerPhone, phone)).orderBy(desc(orders.createdAt));
  }

  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const today = new Date();
    const dateStr = `${year}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    // Get the last order number for today
    const todayOrders = await db
      .select()
      .from(orders)
      .where(sql`${orders.orderNumber} LIKE ${`ORD-${dateStr}-%`}`)
      .orderBy(desc(orders.createdAt))
      .limit(1);
    
    let sequence = 1;
    if (todayOrders.length > 0 && todayOrders[0].orderNumber) {
      const lastNumber = todayOrders[0].orderNumber;
      const lastSequence = parseInt(lastNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }
    
    return `ORD-${dateStr}-${String(sequence).padStart(6, '0')}`;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Generate UUID for order
    const { randomUUID } = await import("crypto");
    const orderId = randomUUID();
    
    // Generate order number if not provided
    const orderNumber = order.orderNumber || await this.generateOrderNumber();
    
    await db.insert(orders).values({ ...order, id: orderId, orderNumber });
    
    // Insert order items
    const itemsWithOrderId = items.map(item => ({ ...item, orderId, id: randomUUID() }));
    await db.insert(orderItems).values(itemsWithOrderId);

    const [newOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    const [updated] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return updated;
  }

  // Internet Packages
  async getInternetPackages(): Promise<InternetPackage[]> {
    return await db.select().from(internetPackages).orderBy(internetPackages.speed);
  }

  async getInternetPackage(id: string): Promise<InternetPackage | undefined> {
    const result = await db.select().from(internetPackages).where(eq(internetPackages.id, id)).limit(1);
    return result[0];
  }

  async createInternetPackage(pkg: InsertInternetPackage): Promise<InternetPackage> {
    await db.insert(internetPackages).values(pkg);
    const [newPkg] = await db.select().from(internetPackages).where(eq(internetPackages.name, pkg.name)).limit(1);
    return newPkg;
  }

  async updateInternetPackage(id: string, pkg: Partial<InsertInternetPackage>): Promise<InternetPackage> {
    await db.update(internetPackages).set(pkg).where(eq(internetPackages.id, id));
    const [updated] = await db.select().from(internetPackages).where(eq(internetPackages.id, id)).limit(1);
    return updated;
  }

  async deleteInternetPackage(id: string): Promise<void> {
    // Check if internet package has order items
    const packageOrderItems = await db.select().from(orderItems).where(eq(orderItems.internetPackageId, id)).limit(1);
    if (packageOrderItems.length > 0) {
      throw new Error("Cannot delete internet package: it has been ordered. Internet packages with orders cannot be deleted.");
    }
    
    await db.delete(internetPackages).where(eq(internetPackages.id, id));
  }

  // Repair Services
  async getRepairServices(): Promise<RepairService[]> {
    return await db.select().from(repairServices).orderBy(repairServices.name);
  }

  async getRepairService(id: string): Promise<RepairService | undefined> {
    const result = await db.select().from(repairServices).where(eq(repairServices.id, id)).limit(1);
    return result[0];
  }

  async createRepairService(service: InsertRepairService): Promise<RepairService> {
    await db.insert(repairServices).values(service);
    const [newService] = await db.select().from(repairServices).where(eq(repairServices.name, service.name)).limit(1);
    return newService;
  }

  async updateRepairService(id: string, service: Partial<InsertRepairService>): Promise<RepairService> {
    await db.update(repairServices).set(service).where(eq(repairServices.id, id));
    const [updated] = await db.select().from(repairServices).where(eq(repairServices.id, id)).limit(1);
    return updated;
  }

  async deleteRepairService(id: string): Promise<void> {
    await db.delete(repairServices).where(eq(repairServices.id, id));
  }

  // Repair Requests
  async getRepairRequests(): Promise<RepairRequest[]> {
    return await db.select().from(repairRequests).orderBy(desc(repairRequests.createdAt));
  }

  async getRepairRequest(id: string): Promise<RepairRequest | undefined> {
    const result = await db.select().from(repairRequests).where(eq(repairRequests.id, id)).limit(1);
    return result[0];
  }

  async getRepairRequestByTrackingNumber(trackingNumber: string): Promise<RepairRequest | undefined> {
    const result = await db.select().from(repairRequests).where(eq(repairRequests.trackingNumber, trackingNumber)).limit(1);
    return result[0];
  }

  async createRepairRequest(request: InsertRepairRequest): Promise<RepairRequest> {
    await db.insert(repairRequests).values(request);
    const [newRequest] = await db.select().from(repairRequests).where(eq(repairRequests.trackingNumber, request.trackingNumber)).limit(1);
    return newRequest;
  }

  async updateRepairRequest(id: string, request: Partial<InsertRepairRequest>): Promise<RepairRequest> {
    await db.update(repairRequests).set(request).where(eq(repairRequests.id, id));
    const [updated] = await db.select().from(repairRequests).where(eq(repairRequests.id, id)).limit(1);
    return updated;
  }

  async deleteRepairRequest(id: string): Promise<void> {
    await db.delete(repairRequests).where(eq(repairRequests.id, id));
  }

  async getRepairRequestsByCustomerPhone(customerPhone: string): Promise<RepairRequest[]> {
    return await db.select().from(repairRequests).where(eq(repairRequests.customerPhone, customerPhone)).orderBy(desc(repairRequests.createdAt));
  }

  // Customers (from repair requests)
  async getCustomers(): Promise<Array<{ phone: string; name: string; email: string | null; totalRepairs: number; lastRepairDate: string | null }>> {
    const allRequests = await db.select().from(repairRequests);
    
    // Group by phone number
    const customerMap = new Map<string, { name: string; email: string | null; repairs: RepairRequest[] }>();
    
    for (const request of allRequests) {
      const phone = request.customerPhone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name: request.customerName,
          email: request.customerEmail,
          repairs: [],
        });
      }
      customerMap.get(phone)!.repairs.push(request);
    }
    
    // Convert to array and calculate stats
    return Array.from(customerMap.entries()).map(([phone, data]) => {
      const sortedRepairs = data.repairs.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      const lastRepair = sortedRepairs[0];
      let lastRepairDate: string | null = null;
      if (lastRepair?.createdAt) {
        if (lastRepair.createdAt instanceof Date) {
          lastRepairDate = lastRepair.createdAt.toISOString();
        } else if (typeof lastRepair.createdAt === 'string') {
          lastRepairDate = lastRepair.createdAt;
        } else {
          lastRepairDate = String(lastRepair.createdAt);
        }
      }
      
      return {
        phone,
        name: data.name,
        email: data.email,
        totalRepairs: data.repairs.length,
        lastRepairDate,
      };
    }).sort((a, b) => {
      // Sort by last repair date (most recent first)
      if (!a.lastRepairDate && !b.lastRepairDate) return 0;
      if (!a.lastRepairDate) return 1;
      if (!b.lastRepairDate) return -1;
      const dateA = new Date(a.lastRepairDate);
      const dateB = new Date(b.lastRepairDate);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getCustomerByPhone(phone: string): Promise<{ phone: string; name: string; email: string | null; totalRepairs: number; lastRepairDate: string | null } | undefined> {
    const requests = await this.getRepairRequestsByCustomerPhone(phone);
    if (requests.length === 0) return undefined;
    
    const sortedRepairs = requests.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    const lastRepair = sortedRepairs[0];
    let lastRepairDate: string | null = null;
    if (lastRepair?.createdAt) {
      if (lastRepair.createdAt instanceof Date) {
        lastRepairDate = lastRepair.createdAt.toISOString();
      } else if (typeof lastRepair.createdAt === 'string') {
        lastRepairDate = lastRepair.createdAt;
      } else {
        lastRepairDate = String(lastRepair.createdAt);
      }
    }
    
    return {
      phone,
      name: requests[0].customerName,
      email: requests[0].customerEmail,
      totalRepairs: requests.length,
      lastRepairDate,
    };
  }

  // Repair Request Images
  async getRepairRequestImages(repairRequestId: string): Promise<RepairRequestImage[]> {
    return await db.select().from(repairRequestImages).where(eq(repairRequestImages.repairRequestId, repairRequestId)).orderBy(repairRequestImages.order);
  }

  async createRepairRequestImage(image: InsertRepairRequestImage): Promise<RepairRequestImage> {
    await db.insert(repairRequestImages).values(image);
    const [newImage] = await db.select().from(repairRequestImages).where(eq(repairRequestImages.imageUrl, image.imageUrl)).limit(1);
    return newImage;
  }

  async deleteRepairRequestImage(id: string): Promise<void> {
    await db.delete(repairRequestImages).where(eq(repairRequestImages.id, id));
  }

  // Slides
  async getAllSlides(): Promise<Slide[]> {
    return await db.select().from(slides).orderBy(slides.order);
  }

  async getSlide(id: string): Promise<Slide | undefined> {
    const result = await db.select().from(slides).where(eq(slides.id, id)).limit(1);
    return result[0];
  }

  async createSlide(slide: InsertSlide): Promise<Slide> {
    await db.insert(slides).values(slide);
    const [newSlide] = await db.select().from(slides).where(eq(slides.title, slide.title)).limit(1);
    return newSlide;
  }

  async updateSlide(id: string, slide: Partial<InsertSlide>): Promise<Slide> {
    await db.update(slides).set(slide).where(eq(slides.id, id));
    const [updated] = await db.select().from(slides).where(eq(slides.id, id)).limit(1);
    return updated;
  }

  async deleteSlide(id: string): Promise<void> {
    await db.delete(slides).where(eq(slides.id, id));
  }

  // Blog Posts
  async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      if (published) {
        return await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.published, true))
          .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
      } else {
        return await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.published, false))
          .orderBy(desc(blogPosts.createdAt));
      }
    }
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostsPaginated(page: number, limit: number, published?: boolean): Promise<{ posts: BlogPost[]; total: number; page: number; limit: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(blogPosts);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    
    if (published === true) {
      query = query.where(eq(blogPosts.published, true)) as any;
      countQuery = countQuery.where(eq(blogPosts.published, true)) as any;
    } else if (published === false) {
      query = query.where(eq(blogPosts.published, false)) as any;
      countQuery = countQuery.where(eq(blogPosts.published, false)) as any;
    }
    
    const [postsResult, countResult] = await Promise.all([
      query.orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);
    
    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);
    
    return {
      posts: postsResult,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return result[0];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return result[0];
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    await db.insert(blogPosts).values(post);
    const [newPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, post.slug))
      .limit(1);
    return newPost;
  }

  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    await db.update(blogPosts).set(post).where(eq(blogPosts.id, id));
    const [updated] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return updated;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    if (existing) {
      await db.update(settings).set({ value: setting.value }).where(eq(settings.key, setting.key));
      const [updated] = await db.select().from(settings).where(eq(settings.key, setting.key)).limit(1);
      return updated;
    } else {
      await db.insert(settings).values(setting);
      const [newSetting] = await db.select().from(settings).where(eq(settings.key, setting.key)).limit(1);
      return newSetting;
    }
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
    const [updated] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return updated;
  }

  // Shipping Regions
  async getShippingRegions(): Promise<ShippingRegion[]> {
    return await db.select().from(shippingRegions).orderBy(shippingRegions.order, shippingRegions.name);
  }

  async getShippingRegion(id: string): Promise<ShippingRegion | undefined> {
    const result = await db.select().from(shippingRegions).where(eq(shippingRegions.id, id)).limit(1);
    return result[0];
  }

  async createShippingRegion(region: InsertShippingRegion): Promise<ShippingRegion> {
    await db.insert(shippingRegions).values(region);
    const all = await db.select().from(shippingRegions).orderBy(desc(shippingRegions.createdAt)).limit(1);
    return all[0];
  }

  async updateShippingRegion(id: string, region: Partial<InsertShippingRegion>): Promise<ShippingRegion> {
    await db.update(shippingRegions).set(region).where(eq(shippingRegions.id, id));
    const [updated] = await db.select().from(shippingRegions).where(eq(shippingRegions.id, id)).limit(1);
    return updated;
  }

  async deleteShippingRegion(id: string): Promise<void> {
    await db.delete(shippingRegions).where(eq(shippingRegions.id, id));
  }

  // Product Images
  async getProductImages(productId: string): Promise<ProductImage[]> {
    return await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.order, productImages.createdAt);
  }

  async createProductImage(image: InsertProductImage): Promise<ProductImage> {
    const { randomUUID } = await import("crypto");
    const imageId = randomUUID();
    await db.insert(productImages).values({ ...image, id: imageId });
    const [newImage] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
    return newImage;
  }

  async updateProductImage(id: string, image: Partial<InsertProductImage>): Promise<ProductImage> {
    await db.update(productImages).set(image).where(eq(productImages.id, id));
    const [updated] = await db.select().from(productImages).where(eq(productImages.id, id)).limit(1);
    return updated;
  }

  async deleteProductImage(id: string): Promise<void> {
    await db.delete(productImages).where(eq(productImages.id, id));
  }

  // Product Reviews
  async getProductReviews(productId: string, approved?: boolean): Promise<ProductReview[]> {
    if (approved !== undefined) {
      return await db
        .select()
        .from(productReviews)
        .where(sql`${productReviews.productId} = ${productId} AND ${productReviews.approved} = ${approved}`)
        .orderBy(desc(productReviews.createdAt));
    }
    return await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const { randomUUID } = await import("crypto");
    const reviewId = randomUUID();
    await db.insert(productReviews).values({ ...review, id: reviewId, approved: review.approved || false });
    const [newReview] = await db.select().from(productReviews).where(eq(productReviews.id, reviewId)).limit(1);
    return newReview;
  }

  async updateProductReview(id: string, review: Partial<InsertProductReview>): Promise<ProductReview> {
    await db.update(productReviews).set(review).where(eq(productReviews.id, id));
    const [updated] = await db.select().from(productReviews).where(eq(productReviews.id, id)).limit(1);
    return updated;
  }

  async deleteProductReview(id: string): Promise<void> {
    await db.delete(productReviews).where(eq(productReviews.id, id));
  }

  async getProductAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const reviews = await db
      .select()
      .from(productReviews)
      .where(sql`${productReviews.productId} = ${productId} AND ${productReviews.approved} = true`);
    
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / reviews.length;
    
    return { average: Math.round(average * 10) / 10, count: reviews.length };
  }

  // Newsletter Subscriptions
  async getNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    return await db.select().from(newsletterSubscriptions).orderBy(desc(newsletterSubscriptions.subscribedAt));
  }

  async deleteNewsletterSubscription(id: string): Promise<void> {
    await db.delete(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, id));
  }

  async createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    const { randomUUID } = await import("crypto");
    const subId = randomUUID();
    await db.insert(newsletterSubscriptions).values({ ...subscription, id: subId, status: "active" });
    const [newSub] = await db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, subId)).limit(1);
    return newSub;
  }

  async unsubscribeNewsletter(email?: string, phone?: string): Promise<void> {
    if (email) {
      await db.update(newsletterSubscriptions).set({ status: "unsubscribed", unsubscribedAt: new Date() }).where(eq(newsletterSubscriptions.email, email));
    } else if (phone) {
      await db.update(newsletterSubscriptions).set({ status: "unsubscribed", unsubscribedAt: new Date() }).where(eq(newsletterSubscriptions.phone, phone));
    }
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getActiveCampaign(type?: string): Promise<Campaign | undefined> {
    const now = new Date();
    let conditions = sql`${campaigns.active} = true 
      AND ${campaigns.startDate} <= ${now} 
      AND ${campaigns.endDate} >= ${now}`;
    
    if (type) {
      conditions = sql`${conditions} AND ${campaigns.type} = ${type}`;
    }
    
    const results = await db.select()
      .from(campaigns)
      .where(conditions)
      .orderBy(desc(campaigns.startDate))
      .limit(1);
    
    return results[0];
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    await db.insert(campaigns).values({ ...campaign, id });
    const [newCampaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign> {
    await db.update(campaigns).set(campaign).where(eq(campaigns.id, id));
    const [updated] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return updated;
  }

  async deleteCampaign(id: string): Promise<void> {
    // First delete all campaign products
    await db.delete(campaignProducts).where(eq(campaignProducts.campaignId, id));
    // Then delete the campaign
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Campaign Products
  async getCampaignProducts(campaignId: string): Promise<Array<CampaignProduct & { product?: Product }>> {
    const campaignProductsList = await db.select()
      .from(campaignProducts)
      .where(eq(campaignProducts.campaignId, campaignId))
      .orderBy(campaignProducts.order);
    
    // Fetch product details for each campaign product
    const productsWithDetails = await Promise.all(
      campaignProductsList.map(async (cp) => {
        const product = await this.getProduct(cp.productId);
        return { ...cp, product: product || undefined };
      })
    );
    
    return productsWithDetails;
  }

  async addProductToCampaign(campaignId: string, productId: string, order: number = 0, specialPrice: string | null = null): Promise<CampaignProduct> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    await db.insert(campaignProducts).values({
      id,
      campaignId,
      productId,
      order,
      specialPrice,
    });
    const [newCampaignProduct] = await db.select().from(campaignProducts).where(eq(campaignProducts.id, id)).limit(1);
    return newCampaignProduct;
  }

  async removeProductFromCampaign(campaignId: string, productId: string): Promise<void> {
    await db.delete(campaignProducts)
      .where(
        sql`${campaignProducts.campaignId} = ${campaignId} AND ${campaignProducts.productId} = ${productId}`
      );
  }

  async updateCampaignProductOrder(campaignId: string, productId: string, order: number): Promise<void> {
    await db.update(campaignProducts)
      .set({ order })
      .where(
        sql`${campaignProducts.campaignId} = ${campaignId} AND ${campaignProducts.productId} = ${productId}`
      );
  }

  async getShippingCostByCity(city: string): Promise<number> {
    const regions = await this.getShippingRegions();
    for (const region of regions) {
      if (region.cities) {
        try {
          const cities = JSON.parse(region.cities) as string[];
          if (cities.some(c => c.toLowerCase() === city.toLowerCase())) {
            return parseFloat(region.cost);
          }
        } catch {
          // JSON parse hatası, string olarak kontrol et
          if (region.cities.toLowerCase().includes(city.toLowerCase())) {
            return parseFloat(region.cost);
          }
        }
      }
    }
    // Varsayılan kargo ücreti
    const defaultShipping = await this.getSetting("default_shipping_cost");
    return defaultShipping ? parseFloat(defaultShipping.value || "0") : 0;
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    const result = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
    return result[0];
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    await db.insert(contactMessages).values({ ...message, id });
    const [newMessage] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
    return newMessage;
  }

  async updateContactMessage(id: string, message: Partial<InsertContactMessage>): Promise<ContactMessage> {
    await db.update(contactMessages).set(message).where(eq(contactMessages.id, id));
    const [updated] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
    return updated;
  }

  async deleteContactMessage(id: string): Promise<void> {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  }

  // FAQs
  async getFAQs(active?: boolean): Promise<FAQ[]> {
    let query = db.select().from(faqs);
    if (active !== undefined) {
      query = query.where(eq(faqs.active, active)) as any;
    }
    return await query.orderBy(faqs.order);
  }

  async getFAQ(id: string): Promise<FAQ | undefined> {
    const result = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
    return result[0];
  }

  async createFAQ(faq: InsertFAQ): Promise<FAQ> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    await db.insert(faqs).values({ ...faq, id });
    const [newFAQ] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
    return newFAQ;
  }

  async updateFAQ(id: string, faq: Partial<InsertFAQ>): Promise<FAQ> {
    await db.update(faqs).set(faq).where(eq(faqs.id, id));
    const [updated] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
    return updated;
  }

  async deleteFAQ(id: string): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
  }

  // Analytics / Page Views
  async createPageView(view: InsertPageView): Promise<PageView> {
    const { randomUUID } = await import("crypto");
    const viewId = randomUUID();
    await db.insert(pageViews).values({ ...view, id: viewId });
    const [newView] = await db.select().from(pageViews).where(eq(pageViews.id, viewId)).limit(1);
    return newView;
  }

  async getPageViews(startDate?: Date, endDate?: Date): Promise<PageView[]> {
    let query = db.select().from(pageViews);
    if (startDate || endDate) {
      if (startDate && endDate) {
        query = query.where(sql`${pageViews.createdAt} BETWEEN ${startDate} AND ${endDate}`) as any;
      } else if (startDate) {
        query = query.where(sql`${pageViews.createdAt} >= ${startDate}`) as any;
      } else if (endDate) {
        query = query.where(sql`${pageViews.createdAt} <= ${endDate}`) as any;
      }
    }
    return await query.orderBy(desc(pageViews.createdAt));
  }

  async getUniqueVisitors(startDate?: Date, endDate?: Date): Promise<number> {
    let query = db.selectDistinct({ sessionId: pageViews.sessionId }).from(pageViews);
    if (startDate || endDate) {
      if (startDate && endDate) {
        query = query.where(sql`${pageViews.createdAt} BETWEEN ${startDate} AND ${endDate}`) as any;
      } else if (startDate) {
        query = query.where(sql`${pageViews.createdAt} >= ${startDate}`) as any;
      } else if (endDate) {
        query = query.where(sql`${pageViews.createdAt} <= ${endDate}`) as any;
      }
    }
    const result = await query;
    return result.length;
  }

  async getPageViewStats(period: "day" | "week" | "month", limit: number = 10): Promise<{
    total: number;
    unique: number;
    topPages: Array<{ path: string; count: number }>;
    totalPages: number;
  }> {
    const now = new Date();
    let startDate: Date;
    
    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
    } else { // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const views = await this.getPageViews(startDate, now);
    const uniqueSessions = new Set(views.map(v => v.sessionId).filter(Boolean));
    
    // Top pages
    const pageCounts = new Map<string, number>();
    views.forEach(view => {
      const count = pageCounts.get(view.path) || 0;
      pageCounts.set(view.path, count + 1);
    });
    
    const allPages = Array.from(pageCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);
    
    const topPages = allPages.slice(0, limit);
    const totalPages = allPages.length;

    return {
      total: views.length,
      unique: uniqueSessions.size,
      topPages,
      totalPages,
    };
  }
}

export const storage = new MySQLStorage();
