"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { dressesAPI } from "@/lib/api-client";
import { Availability } from "@/lib/data/availability";
import DressPageClient from "./DressPageClient";

type Dress = {
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
    images: Array<{ imageUrl: string }>;
  }>;
};

export default function DressPage() {
  const params = useParams();
  const id = params.id as string;
  const [dress, setDress] = useState<Dress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allAvailability] = useState<Availability[]>([]);

  useEffect(() => {
    async function fetchDress() {
      try {
        const response = await dressesAPI.getById(Number(id));
        if (response.success && response.data) {
          setDress(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch dress:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchDress();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!dress) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Robe non trouvée</p>
      </div>
    );
  }

  return (
    <DressPageClient 
      key={dress.id}
      dress={dress} 
      allAvailability={allAvailability} 
    />
  );
}