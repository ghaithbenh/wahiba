import { dressesAPI } from "@/lib/api-client";

// Define types locally since they're not exported from api-client
interface ApiDress {
  id: number;
  name: string;
  description?: string;
  newCollection?: boolean;
  pricePerDay?: number;
  isRentOnDiscount?: boolean;
  newPricePerDay?: number;
  isForSale?: boolean;
  buyPrice?: number;
  isSellOnDiscount?: boolean;
  newBuyPrice?: number;
  sizes?: string[];
  colors?: Array<{
    id: number;
    colorName: string;
    images: Array<{ id: number; imageUrl: string }>;
  }>;
  categories?: Array<{ id: number; name: string }>;
}

interface DressColor {
  id: number;
  colorName: string;
  images: Array<{ id: number; imageUrl: string }>;
}

interface Category {
  id: number;
  name: string;
}

export interface Color {
  _key: string;
  name: string;
  imagesUrls: string[];
}

// Add an interface for the dereferenced Category
export interface DereferencedCategory {
  _id: string;
  _ref: string; // Reference to the category document
  name: string;
  // Add other category fields if you project them in the GROQ query and need them
}

export interface Dress {
  _id: string;
  name: string;
  description: string;
  newCollection: boolean;
  pricePerDay: number;
  isRentOnDiscount?: boolean;
  newPricePerDay?: number;
  isForSale: boolean;
  buyPrice?: number;
  isSellOnDiscount?: boolean;
  newBuyPrice?: number;
  colors: Color[];
  sizes: string[];
  // IMPORTANT: Add the categories field, as dereferenced objects
  categories?: DereferencedCategory[];
}

export async function fetchDresses(): Promise<Dress[]> {
  try {
    const response = await dressesAPI.getAll();
    if (response.success && response.data) {
      return response.data.map((dress: ApiDress) => ({
        _id: String(dress.id),
        name: dress.name,
        description: dress.description || '',
        newCollection: dress.newCollection || false,
        pricePerDay: dress.pricePerDay || 0,
        isRentOnDiscount: dress.isRentOnDiscount || false,
        newPricePerDay: dress.newPricePerDay,
        isForSale: dress.isForSale || false,
        buyPrice: dress.buyPrice,
        isSellOnDiscount: dress.isSellOnDiscount || false,
        newBuyPrice: dress.newBuyPrice,
        colors: dress.colors?.map((color: DressColor) => ({
          _key: String(color.id),
          name: color.colorName,
          imagesUrls: color.images?.map((img) => img.imageUrl) || []
        })) || [],
        sizes: dress.sizes || [],
        categories: dress.categories?.map((cat: Category) => ({
          _id: String(cat.id),
          _ref: String(cat.id),
          name: cat.name
        })) || []
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching dresses:", error);
    return [];
  }
}

// Export as a Promise (though generally, directly calling fetchDresses in useEffect is common)
export const dresses: Promise<Dress[]> = fetchDresses();

export async function fetchDressById(id: string): Promise<Dress | null> {
  try {
    const response = await dressesAPI.getById(Number(id));
    if (response.success && response.data) {
      const dress = response.data;
      return {
        _id: String(dress.id),
        name: dress.name,
        description: dress.description || '',
        newCollection: dress.newCollection || false,
        pricePerDay: dress.pricePerDay || 0,
        isRentOnDiscount: dress.isRentOnDiscount || false,
        newPricePerDay: dress.newPricePerDay,
        isForSale: dress.isForSale || false,
        buyPrice: dress.buyPrice,
        isSellOnDiscount: dress.isSellOnDiscount || false,
        newBuyPrice: dress.newBuyPrice,
        colors: dress.colors?.map((color: DressColor) => ({
          _key: String(color.id),
          name: color.colorName,
          imagesUrls: color.images?.map((img) => img.imageUrl) || []
        })) || [],
        sizes: dress.sizes || [],
        categories: dress.categories?.map((cat: Category) => ({
          _id: String(cat.id),
          _ref: String(cat.id),
          name: cat.name
        })) || []
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching dress by ID:", error);
    return null;
  }
}

export async function updateDress(id: string, values: Partial<Dress>) {
  try {
    // Convert the Dress format to ApiDress format
    const apiValues: Partial<ApiDress> = {
      name: values.name,
      description: values.description,
      newCollection: values.newCollection,
      pricePerDay: values.pricePerDay,
      isRentOnDiscount: values.isRentOnDiscount,
      newPricePerDay: values.newPricePerDay,
      isForSale: values.isForSale,
      buyPrice: values.buyPrice,
      isSellOnDiscount: values.isSellOnDiscount,
      newBuyPrice: values.newBuyPrice,
      sizes: values.sizes,
      colors: values.colors?.map(color => ({
        id: Number(color._key),
        colorName: color.name,
        images: color.imagesUrls.map((url, index) => ({
          id: index + 1,
          imageUrl: url
        }))
      })),
      categories: values.categories?.map(cat => ({
        id: Number(cat._id),
        name: cat.name
      }))
    };
    
    const response = await dressesAPI.update(Number(id), apiValues);
    return response;
  } catch (error) {
    console.error("Error updating dress:", error);
    throw error;
  }
}

export async function deleteDress(id: string) {
  try {
    const response = await dressesAPI.delete(Number(id));
    return response;
  } catch (error) {
    console.error("Error deleting dress:", error);
    throw error;
  }
}