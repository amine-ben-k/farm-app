// src/app/layout.tsx
import './globals.css';
import ClientNavbar from '@/components/ClientNavbar';

export const metadata = {
  title: 'Farm Management System',
  description: 'Manage your farm efficiently',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientNavbar />
        <main>{children}</main>
      </body>
    </html>
  );
}