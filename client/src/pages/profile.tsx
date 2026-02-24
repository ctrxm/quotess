import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Flower, Clock, ArrowUpRight, ArrowDownLeft,
  Gift, Wallet, Plus, CheckCircle, XCircle, Send,
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FlowerTransaction } from "@shared/schema";

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

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showApplyForm, setShowApplyForm] = useState(false);

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

      {/* ── User Card ── */}
      <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-6 shadow-[8px_8px_0px_black]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-black border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-[#FFE34D]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black truncate" data-testid="text-username">@{user.username}</h1>
            <p className="text-black/60 font-semibold text-sm truncate" data-testid="text-email">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-black text-[#FFE34D] text-xs font-black rounded border-2 border-black" data-testid="badge-role">
                {user.role === "admin" ? "👑 Admin" : "Member"}
              </span>
              {user.hasBetaAccess && (
                <span className="px-2 py-1 bg-[#78C1FF] text-black text-xs font-black rounded border-2 border-black">Beta</span>
              )}
              {user.isGiveEnabled && (
                <span className="px-2 py-1 bg-[#A8FF78] text-black text-xs font-black rounded border-2 border-black">🌸 Give Aktif</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Saldo Bunga ── */}
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
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#A8FF78] border-2 border-black rounded-lg font-black text-xs shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-go-topup">
                  <Plus className="w-3 h-3" /> Top Up
                </button>
              </Link>
              <Link href="/withdraw">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-xs shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-go-withdraw">
                  <Wallet className="w-3 h-3" /> Tarik Dana
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links (give enabled) ── */}
      {user.isGiveEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/topup">
            <div className="border-4 border-black rounded-xl bg-[#78C1FF] p-4 shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer" data-testid="card-topup-link">
              <Plus className="w-5 h-5 mb-2" />
              <p className="font-black text-sm">Top Up Bunga</p>
              <p className="text-xs text-black/60 font-semibold">Beli bunga untuk kirim hadiah</p>
            </div>
          </Link>
          <Link href="/withdraw">
            <div className="border-4 border-black rounded-xl bg-[#FFB347] p-4 shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer" data-testid="card-withdraw-link">
              <Wallet className="w-5 h-5 mb-2" />
              <p className="font-black text-sm">Tarik Dana</p>
              <p className="text-xs text-black/60 font-semibold">Tukar bunga jadi rupiah</p>
            </div>
          </Link>
        </div>
      )}

      {/* ── Gift Role Section (only shown when give is disabled) ── */}
      {!user.isGiveEnabled && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-500" />
            Fitur Hadiah
          </h2>

          {/* Show existing application */}
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
                  📋 Catatan admin: {application.adminNote}
                </p>
              )}
              {application.status === "rejected" && (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="mt-3 text-xs font-black text-purple-700 underline"
                  data-testid="button-reapply"
                >
                  Ajukan ulang →
                </button>
              )}
            </div>
          )}

          {/* No application or show form */}
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
                    className="w-full py-3 bg-[#A8FF78] border-2 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
                            <SelectItem value="giver">💸 Pemberi Hadiah</SelectItem>
                            <SelectItem value="receiver">🎁 Penerima Hadiah</SelectItem>
                            <SelectItem value="both">🔄 Pemberi & Penerima</SelectItem>
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
                        className="flex-[2] py-2.5 bg-[#A8FF78] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* ── Riwayat Transaksi ── */}
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
                  {tx.type === "credit" ? "+" : "-"}{tx.amount} 🌸
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
    </div>
  );
}
