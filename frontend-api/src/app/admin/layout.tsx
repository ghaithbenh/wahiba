"use client";

import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Shirt, 
  FolderOpen, 
  Calendar, 
  Mail, 
  DollarSign, 
  Image,
  Images
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/dresses', label: 'Dresses', icon: Shirt },
    { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { href: '/admin/schedules', label: 'Appointments', icon: Calendar },
    { href: '/admin/contacts', label: 'Contacts', icon: Mail },
    { href: '/admin/revenues', label: 'Revenues', icon: DollarSign },
    { href: '/admin/banners', label: 'Banners', icon: Image },
    { href: '/admin/about-images', label: 'About Images', icon: Images },
  ];

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-2xl font-semibold text-gray-800">Wahiba Bridal World</h1>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
        </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}




