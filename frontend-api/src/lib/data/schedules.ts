import { schedulesAPI } from "@/lib/api-client";

interface ScheduleItem {
  dressName: string;
  color: string;
  size?: string;
  quantity: number;
  startDate?: string;
  endDate?: string;
  pricePerDay?: number;
  buyPrice?: number;
  type: 'rental' | 'purchase' | 'quote';
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

// month: YYYY-MM (e.g. 2025-06)
export async function fetchCompletedAppointmentsForMonthByTryOnDate(month: string) {
  try {
    const response = await schedulesAPI.getAll('completed');
    if (response.success && response.data) {
      const start = `${month}-01T00:00:00.000Z`;
      // Calculate last day of the month
      const endDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0); // 0th day of next month = last day of this month
      const end = `${month}-${String(endDate.getDate()).padStart(2, "0")}T23:59:59.999Z`;
      
      return response.data.filter((schedule: Schedule) => {
        if (!schedule.tryOnDate) return false;
        const tryOnDate = new Date(schedule.tryOnDate);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return tryOnDate >= startDate && tryOnDate <= endDate;
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching completed appointments:", error);
    return [];
  }
}
