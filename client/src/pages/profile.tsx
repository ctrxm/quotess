import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Flower, Clock, ArrowUpRight, ArrowDownLeft,
  Gift, Wallet, Plus, CheckCircle, XCircle, Send,
  Bookmark, Zap, Award, Flame, Trophy,
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QuoteCard from "@/components/quote-card";
import type { FlowerTransaction, QuoteWithTags, UserBadge, UserStreak } from "@shared/schema";
import { BADGE_DEFINITIONS } from "@shared/schema";

interface GiftRoleApp {
  id: string;
  userId: string;
  type: string;
  reason: string;
  socialLink?: string | null;
  status: "pending" | "approved" | "rejected";
  adminNote?: string | null;
  createdAt: string;
}

const applySchema = z.object({
  type: z.enum(["giver", "receiver", "both"]),
  reason: z.string().min(10, "Alasan minimal 10 karakter").max(500, "Maksimal 500 karakter"),
  socialLink: z.string().url("URL tidak valid").optional().or(z.literal("")),
});

const TYPE_LABELS: Record<string, string> = { giver: "Pemberi Hadiah", receiver: "Penerima Hadiah", both: "Pemberi & Penerima" };

const STATUS_CONFIG: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Menunggu Review", bg: "bg-yellow-100 border-yellow-400 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  approved: { label: "Disetujui", bg: "bg-green-100 border-green-400 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Ditolak", bg: "bg-red-100 border-red-400 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  pencil: <Send className="w-5 h-5" />,
  "book-open": <Award className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  heart: <Flower className="w-5 h-5 text-red-400" />,
  star: <Trophy className="w-5 h-5 text-yellow-500" />,
  zap: <Zap className="w-5 h-5 text-yellow-500" />,
  trophy: <Trophy className="w-5 h-5 text-yellow-600" />,
  "message-circle": <Send className="w-5 h-5 text-blue-500" />,
  swords: <Award className="w-5 h-5 text-red-500" />,
  bookmark: <Bookmark className="w-5 h-5 text-purple-500" />,
};

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [tab, setTab] = useState<"overview" | "bookmarks">("overview");

  const { data: history = [] } = useQuery<FlowerTransaction[]>({
    queryKey: ["/api/flowers/history"],
    queryFn: () => fetch("/api/flowers/history", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  const { data: application } = useQuery<GiftRoleApp | null>({
    queryKey: ["/api/gift-role/my"],
    queryFn: async () => {
      const r = await fetch("/api/gift-role/my", { credentials: "include" });
      if (!r.ok) return null;
      const data = await r.json();
      if (!data || !data.id) return null;
      return data as GiftRoleApp;
    },
    enabled: !!user && !user.isGiveEnabled,
  });

  const { data: badges = [] } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  const { data: streak } = useQuery<UserStreak | null>({
    queryKey: ["/api/streak"],
    enabled: !!user,
  });

  const { data: bookmarks = [] } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user && tab === "bookmarks",
  });

  useEffect(() => {
    if (user) {
      apiRequest("POST", "/api/streak/update", {}).catch(() => {});
    }
  }, [user]);

  const form = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: { type: "both" as const, reason: "", socialLink: "" },
  });

  const { mutate: submitApplication, isPending: isApplying } = useMutation({
    mutationFn: (data: z.infer<typeof applySchema>) =>
      apiRequest("POST", "/api/gift-role/apply", { ...data, socialLink: data.socialLink || undefined }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Pengajuan terkirim!", description: "Admin akan mereview pengajuanmu segera" });
      qc.invalidateQueries({ queryKey: ["/api/gift-role/my"] });
      setShowApplyForm(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (authLoading) return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-4">
      {[1, 2, 3].map(i => <div key={i} className="border-4 border-black rounded-xl h-32 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" />)}
    </div>
  );

  if (!user) { navigate("/auth"); return null; }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">

      <div className="border-4 border-black rounded-xl bg-[#FFF3B0] p-6 shadow-[8px_8px_0px_black]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-black border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-[#FFF3B0]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black truncate" data-testid="text-username">@{user.username}</h1>
            <p className="text-black/60 font-semibold text-sm truncate" data-testid="text-email">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-black text-[#FFF3B0] text-xs font-black rounded border-2 border-black" data-testid="badge-role">
                {user.role === "admin" ? "Admin" : "Member"}
              </span>
              {user.hasBetaAccess && (
                <span className="px-2 py-1 bg-[#B8DBFF] text-black text-xs font-black rounded border-2 border-black">Beta</span>
              )}
              {user.isGiveEnabled && (
                <span className="px-2 py-1 bg-[#C1F0C1] text-black text-xs font-black rounded border-2 border-black">Give Aktif</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {streak && (
        <div className="border-4 border-black rounded-xl bg-[#FFD1A9] p-4 shadow-[6px_6px_0px_black]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="font-black text-2xl" data-testid="text-streak">{streak.currentStreak}</div>
                <div className="text-xs font-bold text-black/60">Hari Berturut-turut</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-bold text-black/50">
                <Trophy className="w-4 h-4" />
                <span>Terbaik: {streak.longestStreak}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" /> Badge ({badges.length})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => {
              const def = BADGE_DEFINITIONS[b.badgeType];
              if (!def) return null;
              return (
                <div key={b.id} className="flex items-center gap-2 p-2 bg-[#FFF3B0] border-2 border-black rounded-lg" data-testid={`badge-${b.badgeType}`}>
                  <div className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center flex-shrink-0">
                    {BADGE_ICONS[def.icon] || <Award className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xs truncate">{def.name}</p>
                    <p className="text-xs text-black/50 truncate">{def.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("overview")}
          className={`flex-1 py-2 font-black text-sm border-2 border-black rounded-lg transition-all ${tab === "overview" ? "bg-black text-[#FFF3B0] shadow-[3px_3px_0px_#FFF3B0]" : "bg-white shadow-[3px_3px_0px_black]"}`}
          data-testid="tab-overview"
        >
          Overview
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className={`flex-1 py-2 font-black text-sm border-2 border-black rounded-lg transition-all flex items-center justify-center gap-1 ${tab === "bookmarks" ? "bg-black text-[#FFF3B0] shadow-[3px_3px_0px_#FFF3B0]" : "bg-white shadow-[3px_3px_0px_black]"}`}
          data-testid="tab-bookmarks"
        >
          <Bookmark className="w-4 h-4" /> Bookmark
        </button>
      </div>

      {tab === "bookmarks" ? (
        bookmarks.length === 0 ? (
          <div className="border-4 border-black rounded-xl bg-gray-50 p-8 shadow-[4px_4px_0px_black] text-center">
            <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-black text-sm text-gray-400">Belum ada bookmark</p>
            <p className="text-xs text-gray-400 mt-1">Simpan quote favoritmu dengan bookmark</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookmarks.map((q) => <QuoteCard key={q.id} quote={q} />)}
          </div>
        )
      ) : (
        <>
          <div className="border-4 border-black rounded-xl p-5 shadow-[6px_6px_0px_black] bg-white">
            <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Flower className="w-4 h-4 text-pink-400" />
              Saldo Bunga
            </h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black" data-testid="text-balance">{user.flowersBalance ?? 0}</span>
                  <span className="text-xl">🌸</span>
                </div>
                <p className="text-sm text-gray-500 font-semibold mt-1">
                  ≈ Rp {((user.flowersBalance ?? 0) * 10).toLocaleString("id-ID")}
                </p>
              </div>
              {user.isGiveEnabled && (
                <div className="flex flex-col gap-2">
                  <Link href="/topup">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#C1F0C1] border-2 border-black rounded-lg font-black text-xs shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-go-topup">
                      <Plus className="w-3 h-3" /> Top Up
                    </button>
                  </Link>
                  <Link href="/withdraw">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF3B0] border-2 border-black rounded-lg font-black text-xs shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-go-withdraw">
                      <Wallet className="w-3 h-3" /> Tarik Dana
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {user.isGiveEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/topup">
                <div className="border-4 border-black rounded-xl bg-[#B8DBFF] p-4 shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer" data-testid="card-topup-link">
                  <Plus className="w-5 h-5 mb-2" />
                  <p className="font-black text-sm">Top Up Bunga</p>
                  <p className="text-xs text-black/60 font-semibold">Beli bunga untuk kirim hadiah</p>
                </div>
              </Link>
              <Link href="/withdraw">
                <div className="border-4 border-black rounded-xl bg-[#FFD6A5] p-4 shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer" data-testid="card-withdraw-link">
                  <Wallet className="w-5 h-5 mb-2" />
                  <p className="font-black text-sm">Tarik Dana</p>
                  <p className="text-xs text-black/60 font-semibold">Tukar bunga jadi rupiah</p>
                </div>
              </Link>
            </div>
          )}

          {!user.isGiveEnabled && (
            <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
              <h2 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-500" />
                Fitur Hadiah
              </h2>

              {application && !showApplyForm && (
                <div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-bold mb-3 ${STATUS_CONFIG[application.status]?.bg}`}>
                    {STATUS_CONFIG[application.status]?.icon}
                    <span>{STATUS_CONFIG[application.status]?.label}</span>
                    <span className="ml-auto text-xs font-semibold opacity-70">{TYPE_LABELS[application.type] ?? application.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold mb-2 border-l-2 border-gray-300 pl-2 italic">"{application.reason}"</p>
                  {application.adminNote && (
                    <p className="text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded p-2 mt-2">
                      Catatan admin: {application.adminNote}
                    </p>
                  )}
                  {application.status === "rejected" && (
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="mt-3 text-xs font-black text-purple-700 underline"
                      data-testid="button-reapply"
                    >
                      Ajukan ulang
                    </button>
                  )}
                </div>
              )}

              {(!application || (application.status === "rejected" && showApplyForm)) && (
                <>
                  {!showApplyForm ? (
                    <div>
                      <p className="text-sm font-semibold text-black/70 mb-4">
                        Daftarkan dirimu sebagai pemberi atau penerima hadiah. Admin akan mereview pengajuanmu.
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        {[
                          { icon: "💸", title: "Pemberi", desc: "Kirim bunga ke user lain" },
                          { icon: "🎁", title: "Penerima", desc: "Terima & tarik jadi rupiah" },
                          { icon: "🔄", title: "Keduanya", desc: "Kirim & terima sekaligus" },
                        ].map(({ icon, title, desc }) => (
                          <div key={title} className="border-2 border-black rounded-lg p-2 bg-gray-50">
                            <div className="text-2xl mb-1">{icon}</div>
                            <p className="font-black text-xs">{title}</p>
                            <p className="text-gray-500 text-xs leading-tight">{desc}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowApplyForm(true)}
                        className="w-full py-3 bg-[#C1F0C1] border-2 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        data-testid="button-open-apply"
                      >
                        <Gift className="w-4 h-4 inline mr-2" />
                        Ajukan Sekarang
                      </button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((d) => submitApplication(d))} className="flex flex-col gap-4">
                        <FormField control={form.control} name="type" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black text-sm">Peran yang Diajukan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black]" data-testid="select-role-type">
                                  <SelectValue placeholder="Pilih peran" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="giver">Pemberi Hadiah</SelectItem>
                                <SelectItem value="receiver">Penerima Hadiah</SelectItem>
                                <SelectItem value="both">Pemberi & Penerima</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="reason" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black text-sm">Alasan Pengajuan</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ceritakan kenapa kamu ingin bergabung..."
                                className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0 resize-none"
                                rows={3}
                                data-testid="textarea-reason"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="socialLink" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-black text-sm">Link Sosmed <span className="font-normal text-gray-400">(opsional)</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://instagram.com/username"
                                className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0"
                                data-testid="input-social-link"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowApplyForm(false)}
                            className="flex-1 py-2.5 border-2 border-black rounded-lg font-black text-sm bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            data-testid="button-cancel-apply"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={isApplying}
                            className="flex-[2] py-2.5 bg-[#C1F0C1] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            data-testid="button-submit-apply"
                          >
                            <Send className="w-4 h-4" />
                            {isApplying ? "Mengirim..." : "Kirim Pengajuan"}
                          </button>
                        </div>
                      </form>
                    </Form>
                  )}
                </>
              )}
            </div>
          )}

          {history.length > 0 ? (
            <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
              <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Riwayat Bunga
              </h2>
              <div className="flex flex-col gap-3">
                {history.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0" data-testid={`row-tx-${tx.id}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center ${tx.type === "credit" ? "bg-green-100 border-green-500" : "bg-red-100 border-red-400"}`}>
                        {tx.type === "credit"
                          ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          : <ArrowUpRight className="w-4 h-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-black">{tx.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`font-black text-sm ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`} data-testid={`text-tx-amount-${tx.id}`}>
                      {tx.type === "credit" ? "+" : "-"}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
              {history.length > 10 && (
                <p className="text-center text-xs text-gray-400 font-semibold mt-3">+{history.length - 10} transaksi lainnya</p>
              )}
            </div>
          ) : (
            <div className="border-4 border-black rounded-xl bg-gray-50 p-5 shadow-[4px_4px_0px_black] text-center">
              <Flower className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-black text-sm text-gray-400">Belum ada transaksi bunga</p>
              <p className="text-xs text-gray-400 mt-1">Top up atau terima hadiah dari orang lain</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
