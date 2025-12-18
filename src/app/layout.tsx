import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ลานใจใหญ่ - ระบบบริหารจัดการตลาด",
  description: "ระบบบริหารจัดการตลาดลานใจใหญ่ สำหรับจัดการร้านค้า ค่าเช่า และค่าสาธารณูปโภค",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
