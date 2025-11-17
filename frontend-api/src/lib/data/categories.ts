import { categoriesAPI } from "@/lib/api-client";

export interface Category {
  _id: string;
  name: string;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await categoriesAPI.getAll();
    if (response.success && response.data) {
      return response.data.map((cat: { id: number; name: string }) => ({
        _id: String(cat.id),
        name: cat.name
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
