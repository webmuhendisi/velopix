/**
 * Migration script to create campaigns and campaign_products tables
 * Run this script to update the database schema
 */

import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting migration: Create campaigns and campaign_products tables...");
    
    // Create campaigns table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'weekly',
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX start_date_idx (start_date),
        INDEX end_date_idx (end_date),
        INDEX active_idx (active)
      )
    `);
    
    // Create campaign_products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS campaign_products (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        campaign_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        \`order\` INT DEFAULT 0,
        special_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX campaign_id_idx (campaign_id),
        INDEX product_id_idx (product_id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    console.log("✅ Migration completed successfully!");
    console.log("The campaigns and campaign_products tables have been created.");
  } catch (error: any) {
    if (error.message?.includes("Duplicate column name") || error.message?.includes("already exists")) {
      console.log("ℹ️  Tables may already exist. Migration may have already been run.");
    } else {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  } finally {
    process.exit(0);
  }
}

migrate();

