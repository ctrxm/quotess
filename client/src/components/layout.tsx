import { Link, useLocation } from "wouter";
import { Menu, X, Feather, Heart, User, LogOut, Shield, Flower, ChevronDown, Swords, Trophy, BookOpen, Users, Code, BadgeCheck, TrendingUp, Compass, Home, Sun, Moon, Bell, BarChart3 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

interface LayoutProps { children: React.ReactNode; }

const NOTIF_ICONS: Record<string, string> = {
  like: "❤️", comment: "💬", follow: "👥", gift: "🎁", badge: "🏅", reaction: "🔥",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  return `${days}h lalu`;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const settings = useSettings();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const exploreRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: notifCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    queryFn: () => fetch("/api/notifications/count", { credentials: "include" }).then(r => r.json()),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => fetch("/api/notifications", { credentials: "include" }).then(r => r.json()),
    enabled: !!user && notifOpen,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    toast({ title: "Sampai jumpa!", description: "Berhasil keluar" });
  };

  const navBtnClass = (active: boolean) =>
    `px-3 py-2 font-bold text-xs border-2 border-black dark:border-[#555] rounded-md cursor-pointer transition-all duration-100 inline-flex items-center gap-1 ${active ? "bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420] shadow-[3px_3px_0px_#FFF3B0] dark:shadow-[3px_3px_0px_#555]" : "bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#555] hover:shadow-[1px_1px_0px_black] dark:hover:shadow-[1px_1px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px]"}`;

  const exploreLinks = [
    { href: "/explore", label: "Jelajahi", icon: <Compass className="w-3.5 h-3.5" /> },
    { href: "/trending", label: "Trending", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { href: "/collections", label: "Koleksi", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { href: "/leaderboard", label: "Top Penulis", icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  const isExploreActive = ["/explore", "/trending", "/collections", "/leaderboard"].some(p => location.startsWith(p));
  const unreadCount = notifCount?.count || 0;

  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#141420] flex flex-col transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-[#FFF8F0] dark:bg-[#141420] border-b-4 border-black dark:border-[#555]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 bg-[#FFF3B0] dark:bg-[#7a7020] border-3 border-black dark:border-[#555] rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444]">
                <Feather className="w-5 h-5 text-black dark:text-[#f5f0e0]" />
              </div>
              <span className="text-xl font-black tracking-tight text-black dark:text-[#f5f0e0] hidden sm:block">
                {settings.siteName}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            <Link href="/" data-testid="link-nav-beranda">
              <span className={navBtnClass(isActive("/") && location === "/")}>
                <Home className="w-3.5 h-3.5" /> Beranda
              </span>
            </Link>

            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className={navBtnClass(isExploreActive)}
                data-testid="button-nav-explore"
              >
                <Compass className="w-3.5 h-3.5" /> Jelajahi <ChevronDown className={`w-3 h-3 transition-transform ${exploreOpen ? "rotate-180" : ""}`} />
              </button>
              {exploreOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-[#22222e] border-3 border-black dark:border-[#555] rounded-xl shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] overflow-hidden z-50">
                  {exploreLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setExploreOpen(false)}>
                      <div className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 text-black dark:text-[#f5f0e0] ${isActive(link.href) ? "bg-[#FFF3B0] dark:bg-[#7a7020] font-black" : "hover:bg-gray-50 dark:hover:bg-[#333]"}`} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                        {link.icon} {link.label}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/battle" data-testid="link-nav-battle">
              <span className={navBtnClass(isActive("/battle"))}>
                <Swords className="w-3.5 h-3.5" /> Battle
              </span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 border-2 border-black dark:border-[#555] bg-white dark:bg-[#22222e] rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-black" />}
            </button>

            {user ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markRead(); }}
                    className="relative w-9 h-9 border-2 border-black dark:border-[#555] bg-white dark:bg-[#22222e] rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    data-testid="button-notifications"
                  >
                    <Bell className="w-4 h-4 text-black dark:text-[#f5f0e0]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#22222e]" data-testid="badge-notif-count">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#22222e] border-3 border-black dark:border-[#555] rounded-xl shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] overflow-hidden z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b-2 border-black dark:border-[#555] bg-[#FFF3B0] dark:bg-[#7a7020]">
                        <p className="font-black text-sm text-black dark:text-[#f5f0e0]">Notifikasi</p>
                      </div>
                      {notifs.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold text-center py-6">Belum ada notifikasi</p>
                      ) : (
                        notifs.slice(0, 15).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => { if (n.linkUrl) { navigate(n.linkUrl); setNotifOpen(false); } }}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] ${!n.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                            data-testid={`notif-${n.id}`}
                          >
                            <span className="text-lg flex-shrink-0">{NOTIF_ICONS[n.type] || "📌"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-black dark:text-[#f5f0e0] leading-snug">{n.message}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-[#555] rounded-md bg-white dark:bg-[#22222e] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm text-black dark:text-[#f5f0e0]"
                    data-testid="button-user-menu"
                  >
                    <div className="w-6 h-6 bg-[#FFF3B0] dark:bg-[#7a7020] border-2 border-black dark:border-[#555] rounded-full flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="max-w-[100px] truncate">{user.username}</span>
                    {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />}
                    {user.isGiveEnabled && <Flower className="w-4 h-4 text-pink-500" />}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#22222e] border-3 border-black dark:border-[#555] rounded-xl shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] overflow-hidden z-50">
                      <div className="p-3 border-b-2 border-black dark:border-[#555] bg-[#FFF3B0] dark:bg-[#7a7020]">
                        <p className="font-black text-sm flex items-center gap-1 text-black dark:text-[#f5f0e0]">
                          {user.username}
                          {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />}
                        </p>
                        <p className="text-xs text-black/60 dark:text-[#f5f0e0]/60 font-medium truncate">{user.email}</p>
                        {user.isGiveEnabled && (
                          <div className="flex items-center gap-1 mt-1">
                            <Flower className="w-3 h-3 text-pink-500" />
                            <span className="text-xs font-bold text-black dark:text-[#f5f0e0]">{user.flowersBalance} bunga</span>
                          </div>
                        )}
                      </div>
                      {[
                        { href: "/profile", icon: <User className="w-4 h-4" />, label: "Profil", id: "link-profile" },
                        { href: "/stats", icon: <BarChart3 className="w-4 h-4 text-emerald-500" />, label: "Statistik", id: "link-stats" },
                        { href: "/verification", icon: <BadgeCheck className="w-4 h-4 text-blue-500" />, label: "Centang Biru", id: "link-verification" },
                        { href: "/referral", icon: <Users className="w-4 h-4 text-purple-500" />, label: "Referral", id: "link-referral" },
                        { href: "/maker", icon: <Feather className="w-4 h-4 text-orange-500" />, label: "Quote Maker", id: "link-maker" },
                        { href: "/embed", icon: <Code className="w-4 h-4 text-blue-500" />, label: "Widget Embed", id: "link-embed" },
                        { href: "/topup", icon: <Flower className="w-4 h-4 text-yellow-500" />, label: "Top Up Bunga", id: "link-topup" },
                        { href: "/donate", icon: <Heart className="w-4 h-4 text-red-500" />, label: "Donasi", id: "link-donate" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}>
                          <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] border-b border-gray-100 dark:border-gray-700 text-black dark:text-[#f5f0e0]" data-testid={item.id}>
                            {item.icon} {item.label}
                          </div>
                        </Link>
                      ))}
                      {user.isGiveEnabled && (
                        <Link href="/withdraw" onClick={() => setUserMenuOpen(false)}>
                          <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] border-b border-gray-100 dark:border-gray-700 text-black dark:text-[#f5f0e0]" data-testid="link-withdraw">
                            <Flower className="w-4 h-4 text-pink-500" /> Tarik Bunga
                          </div>
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                          <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] border-b border-gray-100 dark:border-gray-700 text-black dark:text-[#f5f0e0]" data-testid="link-admin">
                            <Shield className="w-4 h-4 text-blue-600" /> Admin Panel
                          </div>
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 font-semibold text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" data-testid="button-logout">
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/donate">
                  <span className="px-3 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md cursor-pointer bg-red-50 dark:bg-red-900/20 shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-1 text-black dark:text-[#f5f0e0]" data-testid="link-donate-guest">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Donasi
                  </span>
                </Link>
                <Link href="/auth">
                  <span className="px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md cursor-pointer bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420] shadow-[3px_3px_0px_#FFF3B0] dark:shadow-[3px_3px_0px_#555] hover:shadow-[1px_1px_0px_#FFF3B0] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="link-login">
                    Masuk
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 border-2 border-black dark:border-[#555] bg-white dark:bg-[#22222e] rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] active:shadow-[1px_1px_0px_black] active:translate-x-[2px] active:translate-y-[2px]"
              data-testid="button-theme-toggle-mobile"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-black" />}
            </button>
            {user && (
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markRead(); }}
                className="relative w-9 h-9 border-2 border-black dark:border-[#555] bg-white dark:bg-[#22222e] rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] active:shadow-[1px_1px_0px_black] active:translate-x-[2px] active:translate-y-[2px]"
                data-testid="button-notifications-mobile"
              >
                <Bell className="w-4 h-4 text-black dark:text-[#f5f0e0]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#22222e]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button className="w-9 h-9 border-2 border-black dark:border-[#555] bg-white dark:bg-[#22222e] rounded-md flex items-center justify-center shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] active:shadow-[1px_1px_0px_black] active:translate-x-[2px] active:translate-y-[2px]" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
              {menuOpen ? <X className="w-5 h-5 text-black dark:text-[#f5f0e0]" /> : <Menu className="w-5 h-5 text-black dark:text-[#f5f0e0]" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t-4 border-black dark:border-[#555] bg-[#FFF8F0] dark:bg-[#141420] px-4 py-3 flex flex-col gap-2">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <span className={`block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md cursor-pointer ${isActive("/") && location === "/" ? "bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420]" : "bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0]"}`}>Beranda</span>
            </Link>
            {exploreLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                <span className={`block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md cursor-pointer flex items-center gap-2 ${isActive(link.href) ? "bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420]" : "bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0]"}`}>
                  {link.icon} {link.label}
                </span>
              </Link>
            ))}
            <Link href="/battle" onClick={() => setMenuOpen(false)}>
              <span className={`block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md cursor-pointer flex items-center gap-2 ${isActive("/battle") ? "bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420]" : "bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0]"}`}>
                <Swords className="w-3.5 h-3.5" /> Battle
              </span>
            </Link>
            <Link href="/submit" onClick={() => setMenuOpen(false)}>
              <span className={`block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md cursor-pointer text-black dark:text-[#f5f0e0] ${isActive("/submit") ? "bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420]" : "bg-white dark:bg-[#22222e]"}`}>Submit Quote</span>
            </Link>
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-white dark:bg-[#22222e] flex items-center gap-1 text-black dark:text-[#f5f0e0]">
                    Profil (@{user.username})
                    {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />}
                  </span>
                </Link>
                <Link href="/stats" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-[#C1F0C1] dark:bg-[#1a6a2a] flex items-center gap-1 text-black dark:text-[#f5f0e0]">
                    <BarChart3 className="w-3.5 h-3.5" /> Statistik
                  </span>
                </Link>
                <Link href="/verification" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-[#B8DBFF] dark:bg-[#1a4070] flex items-center gap-1 text-black dark:text-[#f5f0e0]">
                    <BadgeCheck className="w-3.5 h-3.5" /> Centang Biru
                  </span>
                </Link>
                <Link href="/referral" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-[#DDB8FF] dark:bg-[#5a3090] text-black dark:text-[#f5f0e0]">Referral</span>
                </Link>
                <Link href="/topup" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-yellow-50 dark:bg-[#7a7020] text-black dark:text-[#f5f0e0]">Top Up Bunga</span>
                </Link>
                <Link href="/donate" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-red-50 dark:bg-red-900/20 flex items-center gap-1 text-black dark:text-[#f5f0e0]">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Donasi
                  </span>
                </Link>
                {user.isGiveEnabled && (
                  <Link href="/withdraw" onClick={() => setMenuOpen(false)}>
                    <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0]">Tarik Bunga ({user.flowersBalance})</span>
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}>
                    <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-blue-50 dark:bg-blue-900/20 text-black dark:text-[#f5f0e0]">Admin Panel</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 text-left">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/donate" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-red-50 dark:bg-red-900/20 flex items-center gap-1 text-black dark:text-[#f5f0e0]">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Donasi
                  </span>
                </Link>
                <Link href="/auth" onClick={() => setMenuOpen(false)}>
                  <span className="block px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md bg-black dark:bg-[#f5f0e0] text-[#FFF3B0] dark:text-[#141420] text-center">Masuk / Daftar</span>
                </Link>
              </>
            )}
          </div>
        )}

        {notifOpen && (
          <div className="md:hidden border-t-2 border-black dark:border-[#555] bg-white dark:bg-[#22222e] max-h-64 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-sm text-gray-400 font-semibold text-center py-4">Belum ada notifikasi</p>
            ) : (
              notifs.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (n.linkUrl) { navigate(n.linkUrl); setNotifOpen(false); } }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${!n.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                >
                  <span className="text-lg">{NOTIF_ICONS[n.type] || "📌"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-black dark:text-[#f5f0e0]">{n.message}</p>
                    <p className="text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </header>

      {(userMenuOpen || exploreOpen) && <div className="fixed inset-0 z-40" onClick={() => { setUserMenuOpen(false); setExploreOpen(false); }} />}

      <main className="flex-1">{children}</main>

      <footer className="border-t-4 border-black dark:border-[#555] bg-black text-[#FFF3B0] py-4 mt-8">
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
