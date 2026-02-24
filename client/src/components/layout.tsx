import { Link, useLocation } from "wouter";
import { Menu, X, Feather, Heart } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/explore", label: "Jelajahi" },
    { href: "/submit", label: "Submit" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-[#FFFDF0] border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 bg-[#FFE34D] border-3 border-black rounded-md flex items-center justify-center shadow-[3px_3px_0px_black]">
                <Feather className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-black tracking-tight text-black hidden sm:block">
                KataViral
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                <span
                  className={`px-4 py-2 font-bold text-sm border-2 border-black rounded-md cursor-pointer transition-all duration-100 inline-block ${
                    isActive(link.href)
                      ? "bg-black text-[#FFE34D] shadow-[3px_3px_0px_#FFE34D]"
                      : "bg-white text-black shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden w-9 h-9 border-2 border-black bg-white rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] active:shadow-[1px_1px_0px_black] active:translate-x-[2px] active:translate-y-[2px]"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t-4 border-black bg-[#FFFDF0] px-4 py-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} data-testid={`link-mobile-${link.label.toLowerCase()}`}>
                <span
                  className={`block px-4 py-2 font-bold text-sm border-2 border-black rounded-md cursor-pointer ${
                    isActive(link.href) ? "bg-black text-[#FFE34D]" : "bg-white text-black"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t-4 border-black bg-black text-[#FFE34D] py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Feather className="w-4 h-4" />
            <span>KataViral</span>
          </div>
          <p className="text-xs font-medium flex items-center gap-1">
            Made for sharing quotes <Heart className="w-3 h-3 fill-[#FFE34D]" /> Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
}
