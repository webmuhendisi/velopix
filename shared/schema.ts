import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, int, decimal, boolean, timestamp, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Categories table
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  parentId: varchar("parent_id", { length: 36 }),
  icon: varchar("icon", { length: 100 }),
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Products table
export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  image: varchar("image", { length: 500 }),
  categoryId: varchar("category_id", { length: 36 }).notNull(),
  isNew: boolean("is_new").default(false),
  limitedStock: int("limited_stock"),
  inStock: boolean("in_stock").default(true),
  // SEO fields
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: varchar("meta_keywords", { length: 500 }),
  ogImage: varchar("og_image", { length: 500 }),
  slug: varchar("slug", { length: 255 }).unique(),
  // Product identification fields
  sku: varchar("sku", { length: 100 }),
  brand: varchar("brand", { length: 255 }),
  gtin: varchar("gtin", { length: 50 }),
  mpn: varchar("mpn", { length: 100 }),
  specifications: text("specifications"), // JSON: { "key": "value" }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  categoryIdIdx: index("category_id_idx").on(table.categoryId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  slugIdx: index("slug_idx").on(table.slug),
}));

// Orders table (for tracking WhatsApp orders)
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  orderNumber: varchar("order_number", { length: 50 }).unique(), // Müşteri dostu sipariş numarası (ORD-2025-001234)
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  district: varchar("district", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  notes: text("notes"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: varchar("payment_method", { length: 50 }), // whatsapp, bank
  status: varchar("status", { length: 50 }).default("pending"),
  whatsappSent: boolean("whatsapp_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  orderNumberIdx: index("order_number_idx").on(table.orderNumber),
  customerPhoneIdx: index("customer_phone_idx").on(table.customerPhone),
}));

// Order items table
export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }), // Nullable, internet package için null olabilir
  internetPackageId: varchar("internet_package_id", { length: 36 }), // Nullable, product için null olabilir
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Internet packages table
export const internetPackages = mysqlTable("internet_packages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  speed: int("speed").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  features: text("features"), // JSON string
  highlighted: boolean("highlighted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Repair services table
export const repairServices = mysqlTable("repair_services", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Repair requests table
export const repairRequests = mysqlTable("repair_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  trackingNumber: varchar("tracking_number", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  deviceType: varchar("device_type", { length: 255 }).notNull(),
  deviceBrand: varchar("device_brand", { length: 255 }).notNull(),
  deviceModel: varchar("device_model", { length: 255 }).notNull(),
  deviceSerialNumber: varchar("device_serial_number", { length: 255 }),
  problemDescription: text("problem_description").notNull(),
  repairServiceId: varchar("repair_service_id", { length: 36 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, diagnosis, price_quoted, customer_approved, customer_rejected, in_repair, completed, delivered
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }), // İşçilik maliyeti
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }), // Parça maliyeti
  customerApproved: boolean("customer_approved"), // null = bekliyor, true = onaylandı, false = reddedildi
  approvedAt: timestamp("approved_at"),
  diagnosisNotes: text("diagnosis_notes"),
  repairNotes: text("repair_notes"),
  repairItems: text("repair_items"), // JSON: yapılacak işlemler ve değişecek parçalar
  completedAt: timestamp("completed_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Repair request images table
export const repairRequestImages = mysqlTable("repair_request_images", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  repairRequestId: varchar("repair_request_id", { length: 36 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  description: text("description"), // Fotoğraf açıklaması (opsiyonel)
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slides table for hero slider
export const slides = mysqlTable("slides", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  image: varchar("image", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  link: varchar("link", { length: 500 }),
  order: int("order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Blog posts table
export const blogPosts = mysqlTable("blog_posts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featured_image", { length: 500 }),
  author: varchar("author", { length: 255 }),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: varchar("meta_keywords", { length: 500 }),
  ogImage: varchar("og_image", { length: 500 }), // Open Graph image for social media
  modifiedAt: timestamp("modified_at"), // Explicit modification date for SEO
  readingTime: int("reading_time"), // Reading time in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  publishedAtIdx: index("published_at_idx").on(table.publishedAt),
  slugIdx: index("slug_idx").on(table.slug),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

// Contact/Settings table
export const settings = mysqlTable("settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 50 }).default("text"), // text, json, number, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Shipping regions table
export const shippingRegions = mysqlTable("shipping_regions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(), // Bölge adı (örn: "İstanbul", "Ankara", "İzmir")
  cities: text("cities"), // JSON array: ["İstanbul", "Kadıköy", "Beşiktaş"]
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull().default("0"),
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Product images table
export const productImages = mysqlTable("product_images", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  productId: varchar("product_id", { length: 36 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 255 }),
  order: int("order").default(0),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  productIdIdx: index("product_id_idx").on(table.productId),
}));

// Product reviews table
export const productReviews = mysqlTable("product_reviews", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  productId: varchar("product_id", { length: 36 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  verifiedPurchase: boolean("verified_purchase").default(false),
  approved: boolean("approved").default(false), // Admin onayı
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  productIdIdx: index("product_id_idx").on(table.productId),
  ratingIdx: index("rating_idx").on(table.rating),
}));

// Newsletter subscriptions table
export const newsletterSubscriptions = mysqlTable("newsletter_subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  status: varchar("status", { length: 20 }).default("active"), // active, unsubscribed
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  phoneIdx: index("phone_idx").on(table.phone),
}));

// Campaigns table (Haftanın Ürünleri, Black Friday, Flash Sale, etc.)
export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(), // Internal name (e.g., "weekly_products", "black_friday_2024")
  title: varchar("title", { length: 255 }).notNull(), // Display title (e.g., "Haftanın Ürünleri", "Black Friday")
  type: varchar("type", { length: 50 }).notNull().default("weekly"), // weekly, blackfriday, flash_sale, limited_stock
  description: text("description"), // Optional description
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  startDateIdx: index("start_date_idx").on(table.startDate),
  endDateIdx: index("end_date_idx").on(table.endDate),
  activeIdx: index("active_idx").on(table.active),
}));

// Campaign products table (many-to-many relationship)
export const campaignProducts = mysqlTable("campaign_products", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  campaignId: varchar("campaign_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  order: int("order").default(0), // Display order
  specialPrice: decimal("special_price", { precision: 10, scale: 2 }), // Optional campaign-specific price
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignIdIdx: index("campaign_id_idx").on(table.campaignId),
  productIdIdx: index("product_id_idx").on(table.productId),
}));

// Contact messages table
export const contactMessages = mysqlTable("contact_messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("new"), // new, read, replied, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

// FAQ table
// Page views / Analytics table
export const pageViews = mysqlTable("page_views", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  path: varchar("path", { length: 500 }).notNull(),
  referrer: varchar("referrer", { length: 500 }),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pathIdx: index("path_idx").on(table.path),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  sessionIdx: index("session_idx").on(table.sessionId),
}));

export const faqs = mysqlTable("faqs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }), // general, products, shipping, payment, etc.
  order: int("order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  activeIdx: index("active_idx").on(table.active),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  parentId: true,
  icon: true,
  order: true,
});

// Base schema - createInsertSchema decimal'ları string olarak bekler
const baseProductSchema = createInsertSchema(products).pick({
  title: true,
  description: true,
  price: true,
  originalPrice: true,
  image: true,
  categoryId: true,
  isNew: true,
  limitedStock: true,
  inStock: true,
  // SEO fields
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
  ogImage: true,
  slug: true,
  // Product identification fields
  sku: true,
  brand: true,
  gtin: true,
  mpn: true,
  specifications: true,
});

// Decimal ve number alanları için transform ekle - number veya string kabul et
export const insertProductSchema = baseProductSchema.extend({
  // Decimal alanları number veya string kabul et, sonra string'e çevir (MySQL decimal string bekler)
  price: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) throw new Error("Price must be a valid number");
    return num.toFixed(2);
  }),
  originalPrice: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return null;
    return num.toFixed(2);
  }).optional().nullable(),
  // Number alanları number veya string kabul et
  limitedStock: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }).optional().nullable(),
  // Specifications JSON string veya object kabul et
  specifications: z.union([z.string(), z.record(z.string()), z.null()]).transform((val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      try {
        JSON.parse(val);
        return val;
      } catch {
        return null;
      }
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return null;
  }).optional().nullable(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  customerPhone: true,
  address: true,
  city: true,
  district: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  notes: true,
  total: true,
  shippingCost: true,
  paymentMethod: true,
  status: true,
}).extend({
  // orderNumber optional, backend'de generate edilecek
  orderNumber: z.string().optional(),
  // Decimal alanları number veya string kabul et
  total: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) throw new Error("Total must be a valid number");
    return num.toFixed(2);
  }),
  shippingCost: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return "0";
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return "0";
    return num.toFixed(2);
  }).optional().default("0"),
  // Latitude ve longitude decimal kabul et
  latitude: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? null : num.toFixed(8);
  }).optional().nullable(),
  longitude: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? null : num.toFixed(8);
  }).optional().nullable(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  internetPackageId: true,
  quantity: true,
  price: true,
}).extend({
  // productId ve internetPackageId'den en az biri olmalı
  productId: z.string().nullable().optional(),
  internetPackageId: z.string().nullable().optional(),
  quantity: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseInt(String(val));
    return isNaN(num) ? 1 : num;
  }),
  price: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) throw new Error("Price must be a valid number");
    return num.toFixed(2);
  }),
}).refine((data) => data.productId || data.internetPackageId, {
  message: "Either productId or internetPackageId must be provided",
});

// Base schema
const baseInternetPackageSchema = createInsertSchema(internetPackages).pick({
  name: true,
  speed: true,
  price: true,
  provider: true,
  features: true,
  highlighted: true,
});

// Decimal ve number alanları için transform ekle
export const insertInternetPackageSchema = baseInternetPackageSchema.extend({
  // Decimal alanı number veya string kabul et, sonra string'e çevir
  price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val.toString();
    return String(val);
  }),
  // Number alanı number veya string kabul et
  speed: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  // Features JSON string olarak kabul et veya array'i string'e çevir
  features: z.union([z.string(), z.array(z.string()), z.null()]).transform((val) => {
    if (val === null || val === undefined) return null;
    if (Array.isArray(val)) return JSON.stringify(val);
    if (typeof val === 'string') {
      // Eğer zaten JSON string ise olduğu gibi döndür
      try {
        JSON.parse(val);
        return val;
      } catch {
        // JSON değilse array olarak kabul et
        return JSON.stringify([val]);
      }
    }
    return null;
  }).optional().nullable(),
});

export const insertRepairServiceSchema = createInsertSchema(repairServices).pick({
  name: true,
  description: true,
  icon: true,
});

export const insertRepairRequestSchema = createInsertSchema(repairRequests).pick({
  trackingNumber: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  deviceType: true,
  deviceBrand: true,
  deviceModel: true,
  deviceSerialNumber: true,
  problemDescription: true,
  repairServiceId: true,
  status: true,
  estimatedPrice: true,
  finalPrice: true,
  laborCost: true,
  partsCost: true,
  customerApproved: true,
  approvedAt: true,
  diagnosisNotes: true,
  repairNotes: true,
  repairItems: true,
  completedAt: true,
  deliveredAt: true,
});

export const insertRepairRequestImageSchema = createInsertSchema(repairRequestImages).pick({
  repairRequestId: true,
  imageUrl: true,
  description: true,
  order: true,
});

export const insertSlideSchema = createInsertSchema(slides).pick({
  image: true,
  title: true,
  subtitle: true,
  link: true,
  order: true,
  active: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  type: true,
});

// Base shipping region schema
const baseShippingRegionSchema = createInsertSchema(shippingRegions).pick({
  name: true,
  cities: true,
  cost: true,
  order: true,
});

// Product Images schema
export const insertProductImageSchema = createInsertSchema(productImages).pick({
  productId: true,
  imageUrl: true,
  alt: true,
  order: true,
  isPrimary: true,
});

// Product Reviews schema
export const insertProductReviewSchema = createInsertSchema(productReviews).pick({
  productId: true,
  customerName: true,
  customerPhone: true,
  rating: true,
  comment: true,
  verifiedPurchase: true,
  approved: true,
}).extend({
  rating: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseInt(String(val));
    if (isNaN(num) || num < 1 || num > 5) throw new Error("Rating must be between 1 and 5");
    return num;
  }),
});

// Newsletter Subscriptions schema
export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).pick({
  email: true,
  phone: true,
  status: true,
});

// Campaign schemas
export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  name: true,
  title: true,
  type: true,
  description: true,
  startDate: true,
  endDate: true,
  active: true,
}).extend({
  startDate: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }),
  endDate: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }),
  active: z.boolean().default(true),
});

export const insertCampaignProductSchema = createInsertSchema(campaignProducts).pick({
  campaignId: true,
  productId: true,
  order: true,
  specialPrice: true,
}).extend({
  specialPrice: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? null : num.toFixed(2);
  }).optional().nullable(),
  order: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseInt(String(val));
    return isNaN(num) ? 0 : num;
  }).default(0),
});

// Contact Messages Schema
export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  phone: true,
  subject: true,
  message: true,
  status: true,
});

// FAQ Schema
export const insertFAQSchema = createInsertSchema(faqs).pick({
  question: true,
  answer: true,
  category: true,
  order: true,
  active: true,
}).extend({
  order: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseInt(String(val));
    return isNaN(num) ? 0 : num;
  }).default(0),
  active: z.boolean().default(true),
});

// Shipping region schema with transforms
export const insertShippingRegionSchema = baseShippingRegionSchema.extend({
  // Decimal alanı number veya string kabul et, sonra string'e çevir
  cost: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val.toString();
    return String(val);
  }),
  // Cities JSON string veya array kabul et
  cities: z.union([z.string(), z.array(z.string()), z.null()]).transform((val) => {
    if (val === null || val === undefined) return null;
    if (Array.isArray(val)) return JSON.stringify(val);
    if (typeof val === 'string') {
      try {
        JSON.parse(val);
        return val;
      } catch {
        return JSON.stringify([val]);
      }
    }
    return null;
  }).optional().nullable(),
  // Order number veya string kabul et
  order: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }).optional().default(0),
});

// Base blog post schema
const baseBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  featuredImage: true,
  author: true,
  published: true,
  publishedAt: true,
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
  ogImage: true,
  modifiedAt: true,
  readingTime: true,
});

// Blog post schema with transforms
export const insertBlogPostSchema = baseBlogPostSchema.extend({
  // publishedAt string veya date kabul et, null olabilir
  publishedAt: z.union([z.string(), z.date(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      // ISO string formatını kontrol et
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }).optional().nullable(),
  // modifiedAt string veya date kabul et, null olabilir
  modifiedAt: z.union([z.string(), z.date(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }).optional().nullable(),
  // readingTime number veya string kabul et, null olabilir
  readingTime: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }).optional().nullable(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertInternetPackage = z.infer<typeof insertInternetPackageSchema>;
export type InternetPackage = typeof internetPackages.$inferSelect;

export type InsertRepairService = z.infer<typeof insertRepairServiceSchema>;
export type RepairService = typeof repairServices.$inferSelect;

export type InsertRepairRequest = z.infer<typeof insertRepairRequestSchema>;
export type RepairRequest = typeof repairRequests.$inferSelect;

export type InsertRepairRequestImage = z.infer<typeof insertRepairRequestImageSchema>;
export type RepairRequestImage = typeof repairRequestImages.$inferSelect;

export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type Slide = typeof slides.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

export type InsertShippingRegion = z.infer<typeof insertShippingRegionSchema>;
export type ShippingRegion = typeof shippingRegions.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Product Images
export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

// Product Reviews
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

// Newsletter Subscriptions
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;

// Campaigns
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type CampaignProduct = typeof campaignProducts.$inferSelect;
export type InsertCampaignProduct = z.infer<typeof insertCampaignProductSchema>;

// Contact Messages
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

// FAQs
export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = z.infer<typeof insertFAQSchema>;

// Page Views / Analytics
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
