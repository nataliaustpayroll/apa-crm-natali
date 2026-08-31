import './globals.css';
import { Montserrat, Source_Sans_3 } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Australian Payroll Association',
  description:
    'Consulting, training, and membership services for payroll and finance teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
