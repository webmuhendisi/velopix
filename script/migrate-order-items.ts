/**
 * Migration script to add internetPackageId column to order_items table
 * Run this script to update the database schema
 */

import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting migration: Add internetPackageId to order_items table...");
    
    // Make productId nullable and add internetPackageId column
    await db.execute(sql`
      ALTER TABLE order_items 
      MODIFY COLUMN product_id VARCHAR(36) NULL,
      ADD COLUMN internet_package_id VARCHAR(36) NULL AFTER product_id
    `);
    
    console.log("✅ Migration completed successfully!");
    console.log("The order_items table now supports both products and internet packages.");
  } catch (error: any) {
    if (error.message?.includes("Duplicate column name")) {
      console.log("ℹ️  Column internet_package_id already exists. Migration may have already been run.");
    } else {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  } finally {
    process.exit(0);
  }
}

migrate();

