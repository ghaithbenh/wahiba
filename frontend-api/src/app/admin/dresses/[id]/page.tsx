'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

type DressImage = {
  id: number;
  imageUrl: string;   // /uploads/dresses/...
  sortOrder: number;
};

type DressColor = {
  id: number;
  colorName: string;
  images: DressImage[];
};

type Dress = {
  id: number;
  name: string;
  description?: string;
  colors: DressColor[];
};

const COLORS = [
  'Blanc', 'Noir', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Rose', 'Violet',
  'Gris', 'Marron', 'Orange', 'Or', 'Argent', 'Turquoise', 'Corail',
  'Crème', 'Beige', 'Bordeaux', 'Bleu marine', 'Vert menthe', 'Lavande',
  'Magenta', 'Cyan', 'Pêche', 'Indigo'
];

export default function DressDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dressId = params.id as string;

  const [dress, setDress] = useState<Dress | null>(null);
  const [loading, setLoading] = useState(true);
  const [newColorName, setNewColorName] = useState('');
  const [uploadingImages, setUploadingImages] = useState<Record<number, boolean>>({});

  const fetchDress = useCallback(async () => {
    try {
      // ✅ URL relative: Nginx /api → backend
      const res = await fetch(`/api/dresses/${dressId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.success) {
        setDress(data.data as Dress);
      } else {
        toast.error(data?.error || 'Failed to fetch dress details');
      }
    } catch (e) {
      console.error('Error fetching dress:', e);
      toast.error('Failed to fetch dress details');
    } finally {
      setLoading(false);
    }
  }, [dressId]);

  useEffect(() => {
    fetchDress();
  }, [fetchDress]);

  const handleAddColor = async () => {
    if (!newColorName) {
      toast.error('Please select a color');
      return;
    }
    try {
      const res = await fetch(`/api/dresses/${dressId}/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorName: newColorName }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success('Color added successfully');
        setNewColorName('');
        fetchDress();
      } else {
        toast.error(data?.error || 'Failed to add color');
      }
    } catch (e) {
      console.error('Error adding color:', e);
      toast.error('Failed to add color');
    }
  };

  const handleDeleteColor = async (colorId: number) => {
    if (!confirm('Are you sure you want to delete this color and all its images?')) return;
    try {
      const res = await fetch(`/api/dresses/colors/${colorId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        toast.success('Color deleted successfully');
        fetchDress();
      } else {
        toast.error(data?.error || 'Failed to delete color');
      }
    } catch (e) {
      console.error('Error deleting color:', e);
      toast.error('Failed to delete color');
    }
  };

  const handleUploadImages = async (colorId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages((s) => ({ ...s, [colorId]: true }));

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file));

    try {
      const res = await fetch(`/api/dresses/colors/${colorId}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(`${files.length} image(s) uploaded successfully`);
        fetchDress();
      } else {
        toast.error(data?.error || 'Failed to upload images');
      }
    } catch (e) {
      console.error('Error uploading images:', e);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages((s) => ({ ...s, [colorId]: false }));
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/dresses/images/${imageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        toast.success('Image deleted successfully');
        fetchDress();
      } else {
        toast.error(data?.error || 'Failed to delete image');
      }
    } catch (e) {
      console.error('Error deleting image:', e);
      toast.error('Failed to delete image');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!dress) return <div className="text-center py-8">Dress not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{dress.name}</h2>
          <p className="text-gray-500 mt-1">{dress.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Color Variant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a color...</option>
              {COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Button onClick={handleAddColor}>
              <Plus className="h-4 w-4 mr-2" />
              Add Color
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {dress.colors?.length ? (
          dress.colors.map((color) => (
            <Card key={color.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{color.colorName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteColor(color.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete color"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Images for {color.colorName}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleUploadImages(color.id, e.target.files)}
                      disabled={!!uploadingImages[color.id]}
                    />
                    {uploadingImages[color.id] && (
                      <span className="text-sm text-gray-500">Uploading...</span>
                    )}
                  </div>
                </div>

                {color.images?.length ? (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Images ({color.images.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {color.images.map((image) => (
                        <div key={image.id} className="relative group">
                          {image.imageUrl ? (
                            <Image
                              src={image.imageUrl}
                              alt={`${color.colorName} ${image.sortOrder + 1}`}
                              width={300}
                              height={200}
                              sizes="(max-width: 768px) 50vw, 25vw"
                              unoptimized
                              className="rounded-lg object-cover w-full h-48"
                            />
                          ) : (
                            <div className="rounded-lg w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                              No Image
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No color variants added yet. Add one above to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
