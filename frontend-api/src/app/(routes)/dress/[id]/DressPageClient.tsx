import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useCartStore } from "@/lib/store/cart";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Availability, normalizeDate } from "@/lib/data/availability";
import { API_URL } from "@/lib/api-client";

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

interface DressPageClientProps {
  dress: Dress;
  allAvailability: Availability[];
}

export default function DressPageClient({ dress, allAvailability }: DressPageClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [selectedColor, setSelectedColor] = useState(dress.colors && dress.colors.length > 0 ? dress.colors[0].colorName : "");
  const [selectedSize, setSelectedSize] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Reset state when dress changes (for client-side navigation)
  React.useEffect(() => {
    setSelectedColor(dress.colors && dress.colors.length > 0 ? dress.colors[0].colorName : "");
    setSelectedSize("");
    setStartDate(undefined);
    setEndDate(undefined);
    setIsDescriptionExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dress.id]); // Reset when dress ID changes

  const todayNormalized = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isDayDisabled = useCallback((date: Date): boolean => {
    if (date < todayNormalized) {
      return true;
    }

    if (!dress || !dress.id) {
        return false;
    }

    const dressAvailability = allAvailability.find(a => a.dressId === String(dress.id));
    if (!dressAvailability) {
      return false;
    }

    const requestedNormalized = normalizeDate(date);

    return (dressAvailability.unavailableDates || []).some(period => {
      const periodStartNormalized = normalizeDate(period.startDate);
      const periodEndNormalized = normalizeDate(period.endDate);
      
      return requestedNormalized >= periodStartNormalized && requestedNormalized <= periodEndNormalized;
    });
  }, [dress, allAvailability, todayNormalized]);

  const handleAddToCart = () => {
    if (!selectedColor || !startDate || !endDate) {
      toast.error("Please select all required options (color and dates)");
      return;
    }

    if (startDate >= endDate) {
      toast.error("End date must be after start date");
      return;
    }
    
    const currentCheckDate = new Date(startDate);
    currentCheckDate.setHours(0,0,0,0);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(0,0,0,0);

    while (currentCheckDate <= normalizedEndDate) {
      if (isDayDisabled(currentCheckDate)) {
        toast.error(`The dress is unavailable on ${format(currentCheckDate, "PPP")}. Please choose different dates.`);
        return;
      }
      currentCheckDate.setDate(currentCheckDate.getDate() + 1);
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    addItem({
      dressId: String(dress.id),
      quantity: days,
      startDate,
      endDate,
      color: selectedColor,
      size: selectedSize,
      type: 'rental',
      pricePerDay: dress.isRentOnDiscount && dress.newPricePerDay ? dress.newPricePerDay : dress.pricePerDay
    });

    toast.success("Added to cart!");
    router.push("/cart");
  };

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) {
      toast.error("Please select color and size");
      return;
    }

    if (!dress.isForSale || !dress.buyPrice) {
      toast.error("This dress is not available for purchase");
      return;
    }

    addItem({
      dressId: String(dress.id),
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
      type: 'purchase',
      buyPrice: dress.isSellOnDiscount && dress.newBuyPrice ? dress.newBuyPrice : dress.buyPrice
    });

    toast.success("Added to cart!");
    router.push("/cart");
  };

  const handleQuoteRequest = () => {
    if (!selectedColor) {
      toast.error("Please select a color.");
      return;
    }
    
    addItem({
      dressId: String(dress.id),
      quantity: 1,
      color: selectedColor,
      size: selectedSize || '', // Optional size, default to empty string
      type: 'quote',
    });
    
    toast.success("Demande de devis ajoutée au panier!");
    router.push("/checkout");
  };

  const selectedColorImages = dress.colors?.find(color => color.colorName === selectedColor)?.images?.map(img => `${API_URL}${img.imageUrl}`) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {selectedColorImages.length > 0 ? (
              selectedColorImages.map((imageUrl, index) => (
                <div key={index} className="aspect-[3/4] overflow-hidden rounded-lg">
                  <Image
                    src={imageUrl}
                    alt={`${dress.name} - ${selectedColor} - Image ${index + 1}`}
                    width={300}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-8">
                No images available for this color.
              </div>
            )}
          </div>
        </div>

        {/* Dress Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{dress.name}</h1>
            {(dress.isRentOnDiscount || dress.isSellOnDiscount || dress.newCollection) && (
              <span 
                className={`text-white text-xs font-bold px-2 py-1 rounded shadow ${
                  dress.newCollection ? "bg-[#B8A78F]" : "bg-red-500"
                }`}
              >
                {dress.newCollection ? "Nouvelle collection" : "Promo"}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Couleurs</h3>
              <div className="flex gap-2">
                {dress.colors?.map((color) => (
                  <Button
                    key={color.id}
                    variant={selectedColor === color.colorName ? "default" : "outline"}
                    className="capitalize"
                    onClick={() => setSelectedColor(color.colorName)}
                  >
                    {color.colorName}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 mt-2">
                {isDescriptionExpanded
                  ? dress.description
                  : `${dress.description?.substring(0, 100) || ''}... `}
                {dress.description && dress.description.length > 100 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-blue-500 hover:underline"
                  >
                    {isDescriptionExpanded ? "Voir moins" : "Voir plus"}
                  </button>
                )}
              </p>
            </div>
            
            {/* Sizes section is now always visible */}
            <div>
              <h3 className="font-semibold mb-2">Tailles</h3>
              <div className="grid grid-cols-2 gap-2">
                {dress.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`p-2 border rounded ${
                      selectedSize === size
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {!dress.newCollection && (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold">Tarifs</h3>
                  {/* Rental price */}
                  {dress.isRentOnDiscount && dress.newPricePerDay ? (
                    <p className="text-lg">
                      <span className="line-through text-gray-400 mr-2">{dress.pricePerDay} TND/jour</span>
                      <span className="text-red-600 font-bold">{dress.newPricePerDay} TND/jour à louer</span>
                    </p>
                  ) : (
                    <p className="text-lg">{dress.pricePerDay} TND/jour à louer</p>
                  )}
                  {/* Sale price */}
                  {dress.isForSale && (
                    dress.isSellOnDiscount && dress.newBuyPrice ? (
                      <p className="text-lg">
                        <span className="line-through text-gray-400 mr-2">{dress.buyPrice} TND à acheter</span>
                        <span className="text-red-600 font-bold">{dress.newBuyPrice} TND à acheter</span>
                      </p>
                    ) : (
                      <p className="text-lg">{dress.buyPrice} TND à acheter</p>
                    )
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Sélectionner les dates de location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker 
                      label="Date de début" 
                      value={startDate}
                      onChange={setStartDate}
                      disabled={isDayDisabled}
                    />
                    <DatePicker 
                      label="Date de fin" 
                      value={endDate}
                      onChange={setEndDate}
                      disabled={isDayDisabled}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1" onClick={handleAddToCart}>Programmer la location</Button>
                  {dress.isForSale && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleBuyNow}
                    >
                      Programmer l&apos;achat
                    </Button>
                  )}
                </div>
              </>
            )}

            {dress.newCollection && (
              <div className="flex gap-4">
                <Button 
                  className="flex-1" 
                  onClick={handleQuoteRequest}
                >
                  Demander un devis
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

