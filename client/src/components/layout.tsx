import { Link, useLocation } from "wouter";
import { Menu, X, Feather, Heart, User, LogOut, Shield, Flower, TrendingUp, Swords, Trophy, BookOpen, Users, Code } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps { children: React.ReactNode; }

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const settings = useSettings();
  const { toast } = useToast();

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/explore", label: "Jelajahi" },
    { href: "/trending", label: "Trending" },
    { href: "/battle", label: "Battle" },
    { href: "/collections", label: "Koleksi" },
    { href: "/leaderboard", label: "Top" },
  ];

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    toast({ title: "Sampai jumpa!", description: "Berhasil keluar" });
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-[#FFF8F0] border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 bg-[#FFF3B0] border-3 border-black rounded-md flex items-center justify-center shadow-[3px_3px_0px_black]">
                <Feather className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-black tracking-tight text-black hidden sm:block">
                {settings.siteName}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                <span className={`px-3 py-2 font-bold text-xs border-2 border-black rounded-md cursor-pointer transition-all duration-100 inline-block ${isActive(link.href) ? "bg-black text-[#FFF3B0] shadow-[3px_3px_0px_#FFF3B0]" : "bg-white text-black shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"}`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded-md bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm"
                  data-testid="button-user-menu"
                >
                  <div className="w-6 h-6 bg-[#FFF3B0] border-2 border-black rounded-full flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="max-w-[100px] truncate">{user.username}</span>
                  {user.isGiveEnabled && <Flower className="w-4 h-4 text-pink-500" />}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border-3 border-black rounded-xl shadow-[6px_6px_0px_black] overflow-hidden z-50">
                    <div className="p-3 border-b-2 border-black bg-[#FFF3B0]">
                      <p className="font-black text-sm">{user.username}</p>
                      <p className="text-xs text-black/60 font-medium truncate">{user.email}</p>
                      {user.isGiveEnabled && (
                        <div className="flex items-center gap-1 mt-1">
                          <Flower className="w-3 h-3 text-pink-500" />
                          <span className="text-xs font-bold">{user.flowersBalance} bunga</span>
                        </div>
                      )}
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-profile">
                        <User className="w-4 h-4" /> Profil
                      </div>
                    </Link>
                    <Link href="/referral" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-referral">
                        <Users className="w-4 h-4 text-purple-500" /> Referral
                      </div>
                    </Link>
                    <Link href="/maker" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-maker">
                        <Feather className="w-4 h-4 text-orange-500" /> Quote Maker
                      </div>
                    </Link>
                    <Link href="/embed" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-embed">
                        <Code className="w-4 h-4 text-blue-500" /> Widget Embed
                      </div>
                    </Link>
                    <Link href="/topup" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-topup">
                        <Flower className="w-4 h-4 text-yellow-500" /> Top Up Bunga
                      </div>
                    </Link>
                    {user.isGiveEnabled && (
                      <Link href="/withdraw" onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-withdraw">
                          <Flower className="w-4 h-4 text-pink-500" /> Tarik Bunga
                        </div>
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100" data-testid="link-admin">
                          <Shield className="w-4 h-4 text-blue-600" /> Admin Panel
                        </div>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 font-semibold text-sm text-red-600 hover:bg-red-50" data-testid="button-logout">
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth">
                <span className="px-4 py-2 font-bold text-sm border-2 border-black rounded-md cursor-pointer bg-black text-[#FFF3B0] shadow-[3px_3px_0px_#FFF3B0] hover:shadow-[1px_1px_0px_#FFF3B0] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="link-login">
                  Masuk
                </span>
              </Link>
            )}
          </div>

          <button className="md:hidden w-9 h-9 border-2 border-black bg-white rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] active:shadow-[1px_1px_0px_black] active:translate-x-[2px] active:translate-y-[2px]" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t-4 border-black bg-[#FFF8F0] px-4 py-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                <span className={`block px-4 py-2 font-bold text-sm border-2 border-black rounded-md cursor-pointer ${isActive(link.href) ? "bg-black text-[#FFF3B0]" : "bg-white text-black"}`}>
                  {link.label}
                </span>
              </Link>
            ))}
            <Link href="/submit" onClick={() => setMenuOpen(false)}>
              <span className={`block px-4 py-2 font-bold text-sm border-2 border-black rounded-md cursor-pointer ${isActive("/submit") ? "bg-black text-[#FFF3B0]" : "bg-white text-black"}`}>Submit</span>
            </Link>
            <Link href="/maker" onClick={() => setMenuOpen(false)}>
              <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-white">Maker</span>
            </Link>
            <Link href="/embed" onClick={() => setMenuOpen(false)}>
              <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-white">Widget Embed</span>
            </Link>
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-white">Profil (@{user.username})</span>
                </Link>
                <Link href="/referral" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-[#DDB8FF]">Referral</span>
                </Link>
                <Link href="/topup" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-yellow-50">Top Up Bunga</span>
                </Link>
                {user.isGiveEnabled && (
                  <Link href="/withdraw" onClick={() => setMenuOpen(false)}>
                    <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-white">Tarik Bunga ({user.flowersBalance})</span>
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}>
                    <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-blue-50">Admin Panel</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-red-50 text-red-600 text-left">
                  Keluar
                </button>
              </>
            ) : (
              <Link href="/auth" onClick={() => setMenuOpen(false)}>
                <span className="block px-4 py-2 font-bold text-sm border-2 border-black rounded-md bg-black text-[#FFF3B0] text-center">Masuk / Daftar</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}

      <main className="flex-1">{children}</main>

      <footer className="border-t-4 border-black bg-black text-[#FFF3B0] py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Feather className="w-4 h-4" />
            <span>{settings.siteName}</span>
          </div>
          <p className="text-xs font-medium flex items-center gap-1">
            Made for sharing quotes <Heart className="w-3 h-3 fill-[#FFF3B0]" /> Indonesia
          </p>
          <div className="flex gap-3">
            <Link href="/embed"><span className="text-xs font-bold underline cursor-pointer">Widget</span></Link>
            <Link href="/waitlist"><span className="text-xs font-bold underline cursor-pointer">Waitlist</span></Link>
            <Link href="/admin"><span className="text-xs font-bold underline cursor-pointer">Admin</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
