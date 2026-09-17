export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  professionalCount: number;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}
