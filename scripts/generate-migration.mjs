#!/usr/bin/env node
/**
 * Generate a new numbered migration file.
 * Usage: node scripts/generate-migration.mjs "add_recommendations_table"
 */

import { readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

const description = process.argv[2];
if (!description) {
  console.error("Usage: node scripts/generate-migration.mjs <description>");
  process.exit(1);
}

// Find highest existing migration number
const existing = readdirSync(migrationsDir)
  .filter((f) => /^\d{4}_/.test(f))
  .sort();

const lastNum = existing.length > 0
  ? parseInt(existing[existing.length - 1].split("_")[0], 10)
  : 0;

const nextNum = String(lastNum + 1).padStart(4, "0");
const safeName = description.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
const filename = `${nextNum}_${safeName}.sql`;
const filepath = join(migrationsDir, filename);

const template = `-- FORGE Migration ${nextNum}: ${description}
-- Created: ${new Date().toISOString()}

-- ---------------------------------------------------------------------------
-- Write your migration SQL below
-- ---------------------------------------------------------------------------

`;

writeFileSync(filepath, template, "utf8");
console.log(`✓ Created migration: migrations/${filename}`);
