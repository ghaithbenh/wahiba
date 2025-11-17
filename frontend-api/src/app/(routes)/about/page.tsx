"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { aboutImagesAPI } from "@/lib/api-client";

// Type minimal qui couvre camelCase / snake_case
type AboutImage = {
  sortOrder?: number;
  sort_order?: number;
  imageUrl?: string;
  image_url?: string;
};

export default function AboutPage() {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const res = await aboutImagesAPI.getAll(true); // only active
        if (res?.success && Array.isArray(res.data)) {
          const items = res.data as AboutImage[];
          const urls = items
            .sort((a, b) => {
              const sa = a.sortOrder ?? a.sort_order ?? 0;
              const sb = b.sortOrder ?? b.sort_order ?? 0;
              return sa - sb;
            })
            .map((img) => {
              const u = img.imageUrl ?? img.image_url ?? "";
              return u ? (u.startsWith("/") ? u : `/${u}`) : "";
            })
            .filter(Boolean);
          setGalleryImages(urls);
        }
      } catch (e) {
        console.error("Failed to fetch gallery images:", e);
        setError("Impossible de charger les images de la galerie.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGalleryImages();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 mt-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-4">
          À propos de nous
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-600 max-w-2xl mx-auto">
          Votre destination privilégiée pour la location de robes de créateurs. Nous apportons la mode de luxe à vos occasions spéciales.
        </motion.p>
      </div>

      {/* Story */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <p className="text-gray-600 mb-4">
            Wahiba Bridal World est l&apos;endroit où la romance moderne rencontre l&apos;élégance intemporelle…
          </p>
          <p className="text-gray-600">
            Notre équipe sympathique et compétente est là pour vous offrir une expérience fluide…
          </p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold mb-2 text-gray-700">Notre histoire</span>
          <div className="relative aspect-[4/5] w-full max-w-xs md:max-w-sm lg:max-w-md rounded-lg overflow-hidden shadow-lg mx-auto">
            {/* Assure-toi que le fichier existe : /apps/frontend-api/public/about-1.jpeg */}
            <Image
              src="/about-1.jpeg"
              alt="Notre histoire"
              width={600}
              height={400}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        </div>
      </motion.div>

      {/* Galerie */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="mb-20">
        <h2 className="text-3xl font-bold mb-4 text-center">Galerie de moments inoubliables</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-center">
          Découvrez quelques souvenirs et instants précieux capturés dans notre showroom et lors de nos événements.
        </p>

        {isLoading && <p className="text-center text-gray-500">Chargement des images...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!isLoading && !error && galleryImages.length === 0 && (
          <p className="text-center text-gray-500">Aucune image disponible pour la galerie.</p>
        )}

        {!isLoading && !error && galleryImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {galleryImages.map((src, idx) => (
              <motion.div
                key={src + idx}
                className="relative overflow-hidden rounded-lg group aspect-[3/4] shadow-md"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
              >
                <Image
                  src={src} // /uploads/about-us/xxx.png
                  alt={`Galerie Wahiba Bridal ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 rounded-lg"
                  priority={idx < 3}
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
