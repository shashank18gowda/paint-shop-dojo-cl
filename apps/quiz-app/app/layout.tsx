import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Paint Shop Dojo | TKM Training",
  description: "Toyota Kirloskar Motor — Paint Shop Training & Certification",
};

// Reads from Zustand persist 'settings' key to apply theme/font before React hydrates
const applySettingsScript = `
(function(){
  try {
    var raw = localStorage.getItem('settings');
    var state = raw ? JSON.parse(raw).state : {};
    var theme = state.theme || 'dark';
    var size  = state.fontSize || 'md';
    var fontPx = { sm:'13px', md:'16px', lg:'19px', xl:'22px' };
    var bg     = theme === 'light' ? '#f0f0f0' : '#0a0a0a';
    var color  = theme === 'light' ? '#0a0a0a' : '#ffffff';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', size);
    document.documentElement.style.fontSize = fontPx[size] || '16px';
    document.body.style.background = bg;
    document.body.style.color = color;
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySettingsScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EB0A1E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
