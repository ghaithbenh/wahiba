'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { dressesAPI } from '@/lib/api-client';

interface Dress {
  id: number;
  name: string;
  description?: string;
  pricePerDay?: number;
  buyPrice?: number;
  newCollection: boolean;
  isForSale: boolean;
}

export default function DressesPage() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: '',
    buyPrice: '',
    newCollection: false,
    isForSale: false,
    sizes: [] as string[],
  });

  useEffect(() => {
    fetchDresses();
  }, []);

  const fetchDresses = async () => {
    try {
      const res = await dressesAPI.getAll();
      if (res.success && res.data) {
        setDresses(res.data as Dress[]);
      }
    } catch (error) {
      console.error('Error fetching dresses:', error);
      toast.error('Failed to fetch dresses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Dress name is required');
      return;
    }

    try {
      const res = await dressesAPI.create({
        name: formData.name,
        description: formData.description,
        pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : undefined,
        buyPrice: formData.buyPrice ? parseFloat(formData.buyPrice) : undefined,
        newCollection: formData.newCollection,
        isForSale: formData.isForSale,
        sizes: formData.sizes,
      });

      if (res.success) {
        toast.success('Dress created successfully');
        setShowForm(false);
        setFormData({
          name: '',
          description: '',
          pricePerDay: '',
          buyPrice: '',
          newCollection: false,
          isForSale: false,
          sizes: [],
        });
        fetchDresses();
      } else {
        toast.error(res.error || 'Failed to create dress');
      }
    } catch (error) {
      console.error('Error creating dress:', error);
      toast.error('Failed to create dress');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dress?')) return;

    try {
      const res = await dressesAPI.delete(id);
      if (res.success) {
        toast.success('Dress deleted successfully');
        fetchDresses();
      } else {
        toast.error(res.error || 'Failed to delete dress');
      }
    } catch (error) {
      console.error('Error deleting dress:', error);
      toast.error('Failed to delete dress');
    }
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dresses</h2>
          <p className="text-gray-500 mt-2">Manage your dress collection</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Dress
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Dress</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price Per Day</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Buy Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sizes</label>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        const newSizes = formData.sizes.includes(size)
                          ? formData.sizes.filter((s) => s !== size)
                          : [...formData.sizes, size];
                        setFormData({ ...formData, sizes: newSizes });
                      }}
                      className={`px-3 py-1 rounded border ${
                        formData.sizes.includes(size)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.newCollection}
                    onChange={(e) => setFormData({ ...formData, newCollection: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">New Collection</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isForSale}
                    onChange={(e) => setFormData({ ...formData, isForSale: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">For Sale</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Dress</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Dresses ({dresses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Rent Price</TableHead>
                <TableHead>Buy Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dresses.map((dress) => (
                <TableRow key={dress.id}>
                  <TableCell>{dress.id}</TableCell>
                  <TableCell className="font-medium">{dress.name}</TableCell>
                  <TableCell>${typeof dress.pricePerDay === 'number' ? dress.pricePerDay.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell>${typeof dress.buyPrice === 'number' ? dress.buyPrice.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {dress.newCollection && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          New
                        </span>
                      )}
                      {dress.isForSale && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          For Sale
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/dresses/${dress.id}`}>
                      <Button variant="ghost" size="sm" className="mr-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dress.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}




