'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface AboutImage {
  id: number;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export default function AboutImagesPage() {
  const [images, setImages] = useState<AboutImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/about-us-images`, { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setImages(data.data);
      }
    } catch (error) {
      console.error('Error fetching about us images:', error);
      toast.error('Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sortOrder', String(images.length));
    formData.append('isActive', 'true');

    try {
      const response = await fetch(`/api/about-us-images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image uploaded successfully');
        fetchImages();
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const image = images.find((img) => img.id === id);
      if (!image) return;

      const response = await fetch(`/api/about-us-images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sortOrder: image.sort_order,
          isActive: !currentStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image status updated');
        fetchImages();
      } else {
        toast.error(data.error || 'Failed to update image');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/about-us-images/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image deleted successfully');
        fetchImages();
      } else {
        toast.error(data.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">About Us Images</h2>
        <p className="text-gray-500 mt-2">Manage images for the About page</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
            {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <Card key={image.id}>
            <CardContent className="p-4">
              <div className="relative aspect-square mb-4">
                <Image
                  src={image.image_url}
                  alt={`About Us ${image.id}`}
                  fill
                  unoptimized
                  className="rounded-lg object-cover"
                />
                {!image.is_active && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">Inactive</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Order: {image.sort_order}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(image.id, image.is_active)}
                  >
                    {image.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No images uploaded yet. Upload one above to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}




