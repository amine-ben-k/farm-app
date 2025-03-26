import './globals.css';
import { Inter } from 'next/font/google';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Add this import

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FarmApp',
  description: 'Farm Management Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}