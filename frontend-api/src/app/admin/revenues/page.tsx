'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

// Use relative API routes; Next.js rewrites proxy to backend

interface Revenue {
  id: number;
  month: string;
  total_sales: number;
  sales_revenue: number;
  total_rental: number;
  rental_revenue: number;
}

export default function RevenuesPage() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    month: '',
    totalSales: '',
    salesRevenue: '',
    totalRental: '',
    rentalRevenue: '',
  });

  useEffect(() => {
    fetchRevenues();
  }, []);

  const fetchRevenues = async () => {
    try {
      const response = await fetch(`/api/revenues`, { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setRevenues(data.data);
      }
    } catch (error) {
      console.error('Error fetching revenues:', error);
      toast.error('Failed to fetch revenues');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.month) {
      toast.error('Month is required');
      return;
    }

    try {
      const response = await fetch(`/api/revenues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: formData.month,
          totalSales: parseInt(formData.totalSales) || 0,
          salesRevenue: parseFloat(formData.salesRevenue) || 0,
          totalRental: parseInt(formData.totalRental) || 0,
          rentalRevenue: parseFloat(formData.rentalRevenue) || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Revenue record saved successfully');
        setShowForm(false);
        setFormData({
          month: '',
          totalSales: '',
          salesRevenue: '',
          totalRental: '',
          rentalRevenue: '',
        });
        fetchRevenues();
      } else {
        toast.error(data.error || 'Failed to save revenue record');
      }
    } catch (error) {
      console.error('Error saving revenue:', error);
      toast.error('Failed to save revenue record');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this revenue record?')) return;

    try {
      const response = await fetch(`/api/revenues/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Revenue record deleted successfully');
        fetchRevenues();
      } else {
        toast.error(data.error || 'Failed to delete revenue record');
      }
    } catch (error) {
      console.error('Error deleting revenue:', error);
      toast.error('Failed to delete revenue record');
    }
  };

  const totalRevenue = revenues.reduce(
    (sum, rev) => sum + Number(rev.sales_revenue || 0) + Number(rev.rental_revenue || 0),
    0
  );
  const totalSalesRevenue = revenues.reduce((sum, rev) => sum + Number(rev.sales_revenue || 0), 0);
  const totalRentalRevenue = revenues.reduce((sum, rev) => sum + Number(rev.rental_revenue || 0), 0);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue Tracking</h2>
          <p className="text-gray-500 mt-2">Monitor your monthly revenue</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Revenue
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSalesRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rental Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRentalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Revenue Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Month *</label>
                <Input
                  type="date"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Sales Count</label>
                  <Input
                    type="number"
                    value={formData.totalSales}
                    onChange={(e) => setFormData({ ...formData, totalSales: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sales Revenue</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.salesRevenue}
                    onChange={(e) =>
                      setFormData({ ...formData, salesRevenue: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Total Rentals Count</label>
                  <Input
                    type="number"
                    value={formData.totalRental}
                    onChange={(e) => setFormData({ ...formData, totalRental: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rental Revenue</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.rentalRevenue}
                    onChange={(e) =>
                      setFormData({ ...formData, rentalRevenue: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save Revenue</Button>
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
          <CardTitle>Revenue Records ({revenues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Sales Revenue</TableHead>
                <TableHead>Total Rentals</TableHead>
                <TableHead>Rental Revenue</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues.map((revenue) => (
                <TableRow key={revenue.id}>
                  <TableCell className="font-medium">
                    {new Date(revenue.month).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </TableCell>
                  <TableCell>{revenue.total_sales}</TableCell>
                  <TableCell>${Number(revenue.sales_revenue || 0).toFixed(2)}</TableCell>
                  <TableCell>{revenue.total_rental}</TableCell>
                  <TableCell>${Number(revenue.rental_revenue || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">
                    ${(Number(revenue.sales_revenue || 0) + Number(revenue.rental_revenue || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(revenue.id)}
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




