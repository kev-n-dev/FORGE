import { dbAll, dbFirst, type DB } from "../utils";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  is_active: number;
}

export async function getAllActiveCategories(db: DB): Promise<CategoryRow[]> {
  return dbAll<CategoryRow>(
    db,
    "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
  );
}

export async function getCategoryBySlug(db: DB, slug: string): Promise<CategoryRow | null> {
  return dbFirst<CategoryRow>(
    db,
    "SELECT * FROM categories WHERE slug = ? AND is_active = 1",
    slug
  );
}

export async function getCategoryById(db: DB, id: string): Promise<CategoryRow | null> {
  return dbFirst<CategoryRow>(db, "SELECT * FROM categories WHERE id = ?", id);
}
