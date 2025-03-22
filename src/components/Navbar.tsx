// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Animals', href: '/animals' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight hover:text-green-200 transition-colors">
          Farm Management
        </Link>
        <div className="space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-lg font-medium ${
                pathname === link.href
                  ? 'text-green-200 border-b-2 border-green-200'
                  : 'hover:text-green-200 hover:border-b-2 hover:border-green-200 transition-all'
              } pb-1`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}