/**
 * Migration script to create contact_messages and faqs tables
 * Run this script to update the database schema
 */

import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting migration: Create contact_messages and faqs tables...");
    
    // Create contact_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX email_idx (email),
        INDEX status_idx (status),
        INDEX created_at_idx (created_at)
      )
    `);
    
    // Create faqs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS faqs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        question VARCHAR(500) NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100),
        \`order\` INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX category_idx (category),
        INDEX active_idx (active)
      )
    `);
    
    console.log("✅ Migration completed successfully!");
    console.log("The contact_messages and faqs tables have been created.");
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

