import { revenuesAPI } from "@/lib/api-client";

interface Revenue {
  id: number;
  month: string;
  totalSales: number;
  salesRevenue: number;
  totalRental: number;
  rentalRevenue: number;
}

export async function fetchOrCreateMonthlyRevenue(month: string) {
  try {
    const response = await revenuesAPI.getAll();
    if (response.success && response.data) {
      let record = response.data.find((r: Revenue) => r.month === month);
      if (!record) {
        // Create new record if it doesn't exist
        const createResponse = await revenuesAPI.createOrUpdate({
          month,
          totalSales: 0,
          salesRevenue: 0,
          totalRental: 0,
          rentalRevenue: 0,
        });
        if (createResponse.success && createResponse.data) {
          record = createResponse.data;
        }
      }
      return record;
    }
    return null;
  } catch (error) {
    console.error("Error fetching or creating monthly revenue:", error);
    return null;
  }
}

export async function updateMonthlyRevenue(recordId: string, data: Partial<{ totalSales: number; salesRevenue: number; totalRental: number; rentalRevenue: number; }>) {
  try {
    const response = await revenuesAPI.createOrUpdate({ id: Number(recordId), ...data });
    return response;
  } catch (error) {
    console.error("Error updating monthly revenue:", error);
    throw error;
  }
}
