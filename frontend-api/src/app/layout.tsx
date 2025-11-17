import type { Metadata } from "next";
import "./globals.css";
import SocialIcons from "@/components/ui/SocialIcons";
import Link from "next/link";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs';
export const metadata: Metadata = {
  title: "Wahiba Bridal World",
  description: "Wahiba Bridal World",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
          <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '24734162519520664');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=24734162519520664&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        </head>
        <GoogleAnalytics gaId='G-V9NKVKMSC7' />
        <body>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <Toaster />
          {/* Footer with Social Icons */}
          <footer className="mt-16 border-t-2 border-[#bdbdbd] pt-10 pb-6 bg-gradient-to-r from-[#757575] via-[#bdbdbd] to-[#d2c8a3] shadow-inner">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 px-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <span className="text-white text-lg font-bold tracking-widest uppercase drop-shadow-sm">
                  &copy; {new Date().getFullYear()} Wahiba Bridal World
                </span>
                <nav className="flex gap-8 text-base font-medium">
                  <Link
                    href="/"
                    className="text-white hover:text-black transition-colors duration-200"
                  >
                    Accueil
                  </Link>
                  <Link
                    href="/about"
                    className="text-white hover:text-black transition-colors duration-200"
                  >
                    À propos
                  </Link>
                  <Link
                    href="/dresses"
                    className="text-white hover:text-black transition-colors duration-200"
                  >
                    Robes
                  </Link>
                  <Link
                    href="/contact"
                    className="text-white hover:text-black transition-colors duration-200"
                  >
                    Contact
                  </Link>
                </nav>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-xs font-semibold tracking-wide uppercase">
                  Suivez-nous
                </span>
                <div className="rounded-full bg-white/10 p-2 shadow-sm">
                  <SocialIcons />
                </div>
              </div>
            </div>

            {/* <div className="w-full bg-gradient-to-r py-1 flex justify-center items-center">
              <span className="text-xs md:text-sm text-white tracking-wider italic font-light">
                made by{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#bfa76a] font-semibold underline underline-offset-4 hover:text-[black] transition-colors duration-200 drop-shadow-sm"
                  style={{
                    letterSpacing: "0.08em",
                    textShadow: "0 1px 4px black, 0 0px 2px black",
                    fontSize: "1em",
                  }}
                >
                
                </a>
              </span>
            </div> */}
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
