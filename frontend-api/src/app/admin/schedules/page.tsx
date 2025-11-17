'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Schedule {
  id: number;
  full_name: string;
  phone: string;
  status: 'pending' | 'apConfirmed' | 'confirmed' | 'completed' | 'cancelled';
  try_on_date?: string;
  total: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  apConfirmed: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  apConfirmed: 'Appointment Confirmed',
  confirmed: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const fetchSchedules = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const url = filter ? `/api/schedules?status=${filter}` : `/api/schedules`;
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        toast.error('Request timed out');
      } else {
        console.error('Error fetching schedules:', error);
        toast.error('Failed to fetch appointments');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/schedules/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Status updated successfully');
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Appointment deleted successfully');
        fetchSchedules();
      } else {
        toast.error(data.error || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-gray-500 mt-2">Manage customer appointments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Appointments ({schedules.length})</CardTitle>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="apConfirmed">Appointment Confirmed</option>
              <option value="confirmed">Picked Up</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Try On Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.id}</TableCell>
                  <TableCell className="font-medium">{schedule.full_name}</TableCell>
                  <TableCell>{schedule.phone}</TableCell>
                  <TableCell>
                    {schedule.try_on_date
                      ? new Date(schedule.try_on_date).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>${Number(schedule.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <select
                      value={schedule.status}
                      onChange={(e) => handleStatusChange(schedule.id, e.target.value)}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        statusColors[schedule.status]
                      }`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
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




