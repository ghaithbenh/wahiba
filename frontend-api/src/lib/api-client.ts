/**
 * API Client for Wahiba Bridal World
 * Centralized API communication layer for the frontend
 */

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------- Runtime env (front vs SSR) ----------
const IS_SERVER = typeof window === "undefined";
// Utilisé uniquement en SSR (le front garde des URLs relatives)
const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || "http://127.0.0.1:4000";

// N’UTILISE PAS localhost côté navigateur
export const API_URL = ""; // laissé vide volontairement pour éviter les préfixes

// ---------- Types de données ----------
interface Category {
  id: number;
  name: string;
}

interface DressColor {
  id: number;
  colorName: string;
  images: Array<{ id: number; imageUrl: string }>;
}

interface Dress {
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
  colors?: DressColor[];
  categories?: Array<{ id: number; name: string }>;
}

interface ScheduleItem {
  dressName: string;
  color: string;
  size?: string;
  quantity: number;
  startDate?: string;
  endDate?: string;
  pricePerDay?: number;
  buyPrice?: number;
  type: "rental" | "purchase" | "quote";
}

interface Schedule {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  note?: string;
  tryOnDate?: string;
  items: ScheduleItem[];
  total: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface Revenue {
  id: number;
  month: string;
  totalSales: number;
  salesRevenue: number;
  totalRental: number;
  rentalRevenue: number;
  createdAt: string;
}

interface Banner {
  id: number;
  imageUrl: string;  // normalisé
  sortOrder: number; // normalisé
  isActive: boolean; // normalisé
  createdAt?: string;
}

interface AboutImage {
  id: number;
  imageUrl: string;  // normalisé
  sortOrder: number; // normalisé
  isActive: boolean; // normalisé
  createdAt?: string;
}

// ---------- Helpers de normalisation ----------
type BannerApi = {
  id: number;
  image_url?: string;
  imageUrl?: string;
  sort_order?: number;
  sortOrder?: number;
  is_active?: number | boolean | "0" | "1" | "true" | "false";
  isActive?: number | boolean | "0" | "1" | "true" | "false";
  created_at?: string;
};

type AboutImageApi = {
  id: number;
  image_url?: string;
  imageUrl?: string;
  sort_order?: number;
  sortOrder?: number;
  is_active?: number | boolean | "0" | "1" | "true" | "false";
  isActive?: number | boolean | "0" | "1" | "true" | "false";
  created_at?: string;
};

const toBool = (v: unknown) =>
  v === true || v === 1 || v === "1" || v === "true";

const normalizePath = (u?: string) => {
  if (!u) return "";
  return u.startsWith("/") ? u : `/${u}`;
};

// ---------- Fetch wrapper ----------
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const base = IS_SERVER ? INTERNAL_API_URL : "";
    const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;

    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });

    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const json = (await response.json()) as ApiResponse<T>;
        return json;
      } catch (e) {
        const text = await response.text();
        return {
          success: response.ok,
          data: response.ok ? (text as unknown as T) : undefined,
          error: response.ok ? undefined : text || `HTTP ${response.status}`,
        };
      }
    } else {
      const text = await response.text();
      return {
        success: response.ok,
        data: response.ok ? (text as unknown as T) : undefined,
        error: response.ok ? undefined : text || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ---------- Categories API ----------
export const categoriesAPI = {
  getAll: () => apiRequest<Category[]>("/api/categories"),
  getById: (id: number) => apiRequest<Category>(`/api/categories/${id}`),
  create: (name: string) =>
    apiRequest<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (id: number, name: string) =>
    apiRequest<Category>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  delete: (id: number) =>
    apiRequest(`/api/categories/${id}`, { method: "DELETE" }),
};

// ---------- Dresses API ----------
export const dressesAPI = {
  getAll: () => apiRequest<Dress[]>("/api/dresses"),
  getById: (id: number) => apiRequest<Dress>(`/api/dresses/${id}`),
  create: (data: Partial<Dress>) =>
    apiRequest<Dress>("/api/dresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Dress>) =>
    apiRequest<Dress>(`/api/dresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/api/dresses/${id}`, { method: "DELETE" }),

  addColor: (dressId: number, colorName: string) =>
    apiRequest<DressColor>(`/api/dresses/${dressId}/colors`, {
      method: "POST",
      body: JSON.stringify({ colorName }),
    }),

  uploadImages: async (colorId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch(`/api/dresses/colors/${colorId}/images`, {
        method: "POST",
        body: formData,
      });
      return (await res.json()) as ApiResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  },

  deleteColor: (colorId: number) =>
    apiRequest(`/api/dresses/colors/${colorId}`, { method: "DELETE" }),
  deleteImage: (imageId: number) =>
    apiRequest(`/api/dresses/images/${imageId}`, { method: "DELETE" }),
};

// ---------- Schedules API ----------
export const schedulesAPI = {
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return apiRequest<Schedule[]>(`/api/schedules${query}`);
  },
  getById: (id: number) => apiRequest<Schedule>(`/api/schedules/${id}`),
  create: (data: Omit<Schedule, "id" | "createdAt">) =>
    apiRequest<Schedule>("/api/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: string) =>
    apiRequest<Schedule>(`/api/schedules/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    apiRequest(`/api/schedules/${id}`, { method: "DELETE" }),
};

// ---------- Contacts API ----------
export const contactsAPI = {
  getAll: () => apiRequest<Contact[]>("/api/contacts"),
  getById: (id: number) => apiRequest<Contact>(`/api/contacts/${id}`),
  create: (data: Omit<Contact, "id" | "createdAt">) =>
    apiRequest<Contact>("/api/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/api/contacts/${id}`, { method: "DELETE" }),
};

// ---------- Revenues API ----------
export const revenuesAPI = {
  getAll: () => apiRequest<Revenue[]>("/api/revenues"),
  getById: (id: number) => apiRequest<Revenue>(`/api/revenues/${id}`),
  getByMonth: (month: string) =>
    apiRequest<Revenue>(`/api/revenues/month/${month}`),
  createOrUpdate: (data: Partial<Revenue>) =>
    apiRequest<Revenue>("/api/revenues", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/api/revenues/${id}`, { method: "DELETE" }),
};

// ---------- Banners API (normalisé) ----------
export const bannersAPI = {
  getAll: async (activeOnly?: boolean) => {
    const query = activeOnly ? "?active=true" : "";
    const res = await apiRequest<BannerApi[]>(`/api/banners${query}`);
    if (!res.success || !Array.isArray(res.data))
      return { success: false, data: [] as Banner[] };

    const data: Banner[] = (res.data as BannerApi[]).map((b) => ({
      id: b.id,
      imageUrl: normalizePath(b.imageUrl ?? b.image_url),
      sortOrder: (b.sortOrder ?? b.sort_order ?? 0) as number,
      isActive: toBool(b.isActive ?? b.is_active),
      createdAt: b.created_at,
    }));

    return { success: true, data };
  },

  getById: (id: number) => apiRequest<Banner>(`/api/banners/${id}`),

  upload: async (file: File, sortOrder?: number, isActive?: boolean) => {
    const formData = new FormData();
    formData.append("image", file);
    if (sortOrder !== undefined) formData.append("sortOrder", String(sortOrder));
    if (isActive !== undefined) formData.append("isActive", String(isActive));

    try {
      const res = await fetch(`/api/banners`, { method: "POST", body: formData });
      return (await res.json()) as ApiResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  },

  update: (id: number, data: Partial<Banner>) =>
    apiRequest<Banner>(`/api/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/api/banners/${id}`, { method: "DELETE" }),
};

// ---------- About Us Images API (normalisé) ----------
export const aboutImagesAPI = {
  getAll: async (activeOnly?: boolean) => {
    const query = activeOnly ? "?active=true" : "";
    const res = await apiRequest<AboutImageApi[]>(`/api/about-us-images${query}`);
    if (!res.success || !Array.isArray(res.data))
      return { success: false, data: [] as AboutImage[] };

    const data: AboutImage[] = (res.data as AboutImageApi[]).map((it) => ({
      id: it.id,
      imageUrl: normalizePath(it.imageUrl ?? it.image_url),
      sortOrder: (it.sortOrder ?? it.sort_order ?? 0) as number,
      isActive: toBool(it.isActive ?? it.is_active),
      createdAt: it.created_at,
    }));

    return { success: true, data };
  },

  getById: (id: number) =>
    apiRequest<AboutImage>(`/api/about-us-images/${id}`),

  upload: async (file: File, sortOrder?: number, isActive?: boolean) => {
    const formData = new FormData();
    formData.append("image", file);
    if (sortOrder !== undefined) formData.append("sortOrder", String(sortOrder));
    if (isActive !== undefined) formData.append("isActive", String(isActive));

    try {
      const res = await fetch(`/api/about-us-images`, {
        method: "POST",
        body: formData,
      });
      return (await res.json()) as ApiResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  },

  update: (id: number, data: Partial<AboutImage>) =>
    apiRequest<AboutImage>(`/api/about-us-images/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/api/about-us-images/${id}`, { method: "DELETE" }),
};

// ---------- Health ----------
export const healthCheck = () => apiRequest("/api/health");
