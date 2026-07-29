import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RentWiFi - ระบบสมัครและเข้าใช้งานอินเทอร์เน็ต WiFi',
  description: 'บริการอินเทอร์เน็ต WiFi ความเร็วสูง เช่าใช้งานง่าย จ่ายผ่าน PromptPay',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Kanit',sans-serif]">{children}</body>
    </html>
  );
}
