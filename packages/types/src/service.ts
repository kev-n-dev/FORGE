export interface ServiceListing {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  startingPrice: number | null;
  currency: string;
  priceUnit: string | null;
  isActive: boolean;
  createdAt: string;
}
