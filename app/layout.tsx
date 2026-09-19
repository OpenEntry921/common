import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = { title: "COMMON — Coffee · Community · Care", description: "우리 동네의 따뜻한 연결을 만드는 커뮤니티" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f3ec" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ko"><body><AppShell>{children}</AppShell></body></html>;
}
