'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shirt, Calendar, Mail, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Stats = {
  totalDresses: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalContacts: number;
  monthlyRevenue: number;
};

type StatCard = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor?: string;
  subtitle?: string; // optionnel
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDresses: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    totalContacts: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [dresses, schedules, contacts] = await Promise.all([
        fetch('/api/dresses', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/schedules', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/contacts', { cache: 'no-store' }).then((r) => r.json()),
      ]);

      const pendingCount =
        schedules?.data?.filter((s: { status: string }) => s.status === 'pending')?.length || 0;

      setStats({
        totalDresses: dresses?.data?.length || 0,
        totalAppointments: schedules?.data?.length || 0,
        pendingAppointments: pendingCount,
        totalContacts: contacts?.data?.length || 0,
        monthlyRevenue: 0, // TODO: brancher sur /api/revenues si besoin
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    {
      title: 'Total Dresses',
      value: stats.totalDresses,
      icon: Shirt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${stats.pendingAppointments} pending`,
    },
    {
      title: 'Contact Messages',
      value: stats.totalContacts,
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-gray-500 mt-2">Welcome to your admin dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor ?? ''}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/dresses"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold">Manage Dresses</h3>
              <p className="text-sm text-gray-500">Add, edit, or remove dress listings</p>
            </Link>
            <Link
              href="/admin/schedules"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold">View Appointments</h3>
              <p className="text-sm text-gray-500">Manage customer appointments</p>
            </Link>
            <Link
              href="/admin/contacts"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold">Review Messages</h3>
              <p className="text-sm text-gray-500">Check customer inquiries</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium text-gray-900">Today</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
