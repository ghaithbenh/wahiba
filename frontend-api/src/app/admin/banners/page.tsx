'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

type Banner = {
  id: number;
  image_url: string;   // ex: /uploads/banners/1761....png
  sort_order: number;
  is_active: boolean | number;
};

// helper pour les booléens venant de MySQL (0/1)
const asBool = (v: boolean | number) => (v === true || v === 1);

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  // 🔹 Utilise des URL *relatives* pour l’API (Nginx proxy /api → backend)
  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners', { cache: 'no-store' });
      const data = await res.json();
      if (data?.success) setBanners(data.data || []);
      else toast.error(data?.error || 'Failed to fetch banners');
    } catch (e) {
      console.error('Error fetching banners:', e);
      toast.error('Failed to fetch banners');
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
    formData.append('sortOrder', String(banners.length));
    formData.append('isActive', 'true');

    try {
      const res = await fetch('/api/banners', { method: 'POST', body: formData });
      const data = await res.json();
      if (data?.success) {
        toast.success('Banner uploaded successfully');
        fetchBanners();
      } else {
        toast.error(data?.error || 'Failed to upload banner');
      }
    } catch (e) {
      console.error('Error uploading banner:', e);
      toast.error('Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const banner = banners.find((b) => b.id === id);
      if (!banner) return;

      const res = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sortOrder: banner.sort_order,
          isActive: !currentStatus,
        }),
      });

      const data = await res.json();
      if (data?.success) {
        toast.success('Banner status updated');
        fetchBanners();
      } else {
        toast.error(data?.error || 'Failed to update banner');
      }
    } catch (e) {
      console.error('Error updating banner:', e);
      toast.error('Failed to update banner');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        toast.success('Banner deleted successfully');
        fetchBanners();
      } else {
        toast.error(data?.error || 'Failed to delete banner');
      }
    } catch (e) {
      console.error('Error deleting banner:', e);
      toast.error('Failed to delete banner');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Banners</h2>
        <p className="text-gray-500 mt-2">Manage homepage banner images</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Banner</CardTitle>
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
        {banners.map((banner) => {
          const active = asBool(banner.is_active);
          return (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="relative aspect-video mb-4">
                  {/* 🔸 Image: utilise l’URL relative stockée en BDD (/uploads/...) */}
                  <Image
                    src={banner.image_url}
                    alt={`Banner ${banner.id}`}
                    fill
                    unoptimized
                    className="rounded-lg object-cover"
                  />

                  {!active && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">Inactive</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Order: {banner.sort_order}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(banner.id, active)}
                      title={active ? 'Disable' : 'Enable'}
                    >
                      {active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {banners.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No banners uploaded yet. Upload one above to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
