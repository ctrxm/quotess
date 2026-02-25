import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Heart, Eye, MessageCircle, Flame, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MOOD_LABELS, MOOD_COLORS, type Mood } from "@shared/schema";

interface DashboardStats {
  totalQuotes: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalReactions: number;
  bestQuote: { id: string; text: string; likesCount: number; mood: string } | null;
  moodBreakdown: Record<string, number>;
}

export default function Stats() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/user/stats"],
    queryFn: () => fetch("/api/user/stats", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  const { data: streak } = useQuery<{ currentStreak: number; longestStreak: number }>({
    queryKey: ["/api/streak"],
    queryFn: () => fetch("/api/streak", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  if (authLoading || isLoading) return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-4">
      {[1, 2, 3].map(i => <div key={i} className="border-4 border-black dark:border-[#555] rounded-xl h-32 bg-gray-100 dark:bg-[#22222e] animate-pulse shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444]" />)}
    </div>
  );
  if (!user) return null;
  if (!stats) return null;

  const maxMood = Math.max(...Object.values(stats.moodBreakdown), 1);

  const statCards = [
    { label: "Total Quote", value: stats.totalQuotes, icon: FileText, color: "bg-[#FFF3B0] dark:bg-[#7a7020]" },
    { label: "Total Like", value: stats.totalLikes, icon: Heart, color: "bg-[#FFB3B3] dark:bg-[#8a2530]" },
    { label: "Total View", value: stats.totalViews, icon: Eye, color: "bg-[#B8DBFF] dark:bg-[#1a4070]" },
    { label: "Total Reaksi", value: stats.totalReactions, icon: Flame, color: "bg-[#FFD1A9] dark:bg-[#8a5020]" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Link href="/profile">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black dark:border-[#555] px-4 py-2 rounded-lg bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back-stats">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </Link>

      <div className="border-4 border-black dark:border-[#555] rounded-xl bg-[#DDB8FF] dark:bg-[#5a3090] p-5 shadow-[8px_8px_0px_black] dark:shadow-[8px_8px_0px_#444] mb-6">
        <h1 className="text-2xl font-black text-black dark:text-[#f5f0e0] flex items-center gap-2" data-testid="text-stats-title">
          <TrendingUp className="w-6 h-6" /> Statistik Kamu
        </h1>
        <p className="font-semibold text-sm text-black/70 dark:text-[#f5f0e0]/70 mt-1">Dashboard aktivitas dan pencapaian</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`border-3 border-black dark:border-[#555] rounded-xl ${card.color} p-4 shadow-[5px_5px_0px_black] dark:shadow-[5px_5px_0px_#444]`} data-testid={`stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
              <Icon className="w-5 h-5 text-black dark:text-[#f5f0e0] mb-1" />
              <p className="text-2xl font-black text-black dark:text-[#f5f0e0]">{card.value.toLocaleString("id-ID")}</p>
              <p className="text-xs font-bold text-black/60 dark:text-[#f5f0e0]/60">{card.label}</p>
            </div>
          );
        })}
      </div>

      {streak && (
        <div className="border-4 border-black dark:border-[#555] rounded-xl bg-[#C1F0C1] dark:bg-[#1a6a2a] p-5 shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] mb-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 text-black dark:text-[#f5f0e0] flex items-center gap-2">
            <Flame className="w-4 h-4" /> Streak Harian
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p className="text-3xl font-black text-black dark:text-[#f5f0e0]">🔥 {streak.currentStreak}</p>
              <p className="text-xs font-bold text-black/60 dark:text-[#f5f0e0]/60">Hari Berturut</p>
            </div>
            <div className="w-px bg-black/20 dark:bg-white/20" />
            <div className="flex-1 text-center">
              <p className="text-3xl font-black text-black dark:text-[#f5f0e0]">🏆 {streak.longestStreak}</p>
              <p className="text-xs font-bold text-black/60 dark:text-[#f5f0e0]/60">Rekor Terpanjang</p>
            </div>
          </div>
        </div>
      )}

      {stats.bestQuote && (
        <div className="border-4 border-black dark:border-[#555] rounded-xl bg-white dark:bg-[#22222e] p-5 shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] mb-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 text-black dark:text-[#f5f0e0] flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Quote Terpopuler
          </h2>
          <Link href={`/q/${stats.bestQuote.id}`}>
            <div className="border-2 border-black dark:border-[#555] rounded-lg p-4 bg-[#FFF3B0] dark:bg-[#7a7020] cursor-pointer hover:shadow-[2px_2px_0px_black] transition-all" data-testid="card-best-quote">
              <blockquote className="font-bold text-sm text-black dark:text-[#f5f0e0] leading-snug">&ldquo;{stats.bestQuote.text}&rdquo;</blockquote>
              <div className="flex items-center gap-2 mt-2">
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                <span className="text-xs font-bold text-black/60 dark:text-[#f5f0e0]/60">{stats.bestQuote.likesCount} likes</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {Object.keys(stats.moodBreakdown).length > 0 && (
        <div className="border-4 border-black dark:border-[#555] rounded-xl bg-white dark:bg-[#22222e] p-5 shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] mb-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 text-black dark:text-[#f5f0e0] flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Distribusi Mood
          </h2>
          <div className="flex flex-col gap-3">
            {Object.entries(stats.moodBreakdown).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
              const m = mood as Mood;
              const mc = MOOD_COLORS[m];
              const pct = Math.round((count / maxMood) * 100);
              return (
                <div key={mood} data-testid={`mood-bar-${mood}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border-2 border-black dark:border-[#555] ${mc?.bg || "bg-gray-100"} ${mc?.text || "text-gray-700"}`}>
                      {MOOD_LABELS[m] || mood}
                    </span>
                    <span className="text-xs font-black text-black dark:text-[#f5f0e0]">{count}</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full border border-black/10 dark:border-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${mc?.bg || "bg-gray-300"} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-4 border-black dark:border-[#555] rounded-xl bg-white dark:bg-[#22222e] p-5 shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444]">
        <h2 className="font-black text-sm uppercase tracking-widest mb-3 text-black dark:text-[#f5f0e0]">Ringkasan</h2>
        <div className="flex flex-col gap-2 text-sm font-semibold text-black/70 dark:text-[#f5f0e0]/70">
          <p>📝 {stats.totalQuotes} quote ditulis</p>
          <p>❤️ {stats.totalLikes} like diterima</p>
          <p>👁️ {stats.totalViews} kali dilihat</p>
          <p>💬 {stats.totalComments} komentar diterima</p>
          <p>🔥 {stats.totalReactions} reaksi diterima</p>
        </div>
      </div>
    </div>
  );
}
