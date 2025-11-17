import { schedulesAPI } from "@/lib/api-client";

// --- Interfaces for Availability Data ---
interface UnavailableDateRange {
  startDate: Date;
  endDate: Date;
}

export interface Availability {
  dressId: string;
  unavailableDates: UnavailableDateRange[];
}

export async function fetchDressAvailability(): Promise<Availability[]> {
  try {
    const response = await schedulesAPI.getAll('confirmed');
    
    if (!response.success || !response.data) {
      return [];
    }

    const schedules = response.data;
    const dressAvailabilityMap: Map<string, UnavailableDateRange[]> = new Map();

    schedules.forEach((schedule) => {
      schedule.items?.forEach((item) => {
        if (item.type === 'rental' && item.startDate && item.endDate) {
          const dressId = String(schedule.id); // Use schedule ID as dress identifier
          const startDate = new Date(item.startDate);
          const endDate = new Date(item.endDate);

          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            if (!dressAvailabilityMap.has(dressId)) {
              dressAvailabilityMap.set(dressId, []);
            }
            dressAvailabilityMap.get(dressId)!.push({ startDate, endDate });
          }
        }
      });
    });

    return Array.from(dressAvailabilityMap.entries()).map(([dressId, unavailableDates]) => ({
      dressId,
      unavailableDates,
    }));
  } catch (error) {
    console.error('Error fetching dress availability:', error);
    return [];
  }
}

// Helper function to normalize a Date object to just its date part (midnight UTC)
export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};