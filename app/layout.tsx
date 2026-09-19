import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = { title: "COMMON — Coffee · Community · Care", description: "우리 동네의 따뜻한 연결을 만드는 커뮤니티" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f3ec" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ko" className={notoSansKR.variable}><body><AppShell>{children}</AppShell></body></html>;
}
