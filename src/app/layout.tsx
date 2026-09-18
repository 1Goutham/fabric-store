import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";
import { Providers } from "@/components/layout/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { AssistantPanel, AskFab } from "@/components/intelligence/assistant-panel";
import { BRAND } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400", "500", "600"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "FabricNest", template: "%s · FabricNest" },
  description: `${BRAND.tagline} A premium, intelligent commerce platform. ${BRAND.signature}.`,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  authors: [{ name: BRAND.creator, url: BRAND.creatorUrl }],
  creator: BRAND.creator,
  openGraph: { title: "FabricNest", description: BRAND.tagline, siteName: "FabricNest", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">
          Skip to content
        </a>
        <Providers initialUser={user}>
          <SiteHeader />
          <div id="main">{children}</div>
          <MobileTabBar />
          <SearchOverlay />
          <CartDrawer />
          <AssistantPanel />
          <AskFab />
        </Providers>
      </body>
    </html>
  );
}
