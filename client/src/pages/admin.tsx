import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Check, X, Clock, Users, Settings, Flower, Wallet, ListOrdered, Lock, Mail, Toggle, ArrowRight, Copy, Plus, KeyRound, ShoppingBag, Gift, Megaphone, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { QuoteWithTags, User, Waitlist, GiftType, WithdrawalRequest, WithdrawalMethod, TopupPackage, TopupRequest, BetaCode, Ad } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS } from "@shared/schema";
import type { Mood } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";

type Tab = "quotes" | "users" | "waitlist" | "gifts" | "giftroles" | "withdrawals" | "topup" | "betacodes" | "ads" | "settings";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("quotes");
  const { toast } = useToast();
  const qc = useQueryClient();

  if (authLoading) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="h-48 border-4 border-black rounded-xl bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" /></div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-10 shadow-[8px_8px_0px_black]">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Akses Ditolak</h2>
          <p className="font-semibold text-black/70 mb-4">Halaman ini hanya untuk admin.</p>
          {!user && <Link href="/auth"><button className="px-6 py-2 bg-black text-[#FFE34D] font-black border-3 border-black rounded-lg shadow-[4px_4px_0px_#FFE34D]">Login</button></Link>}
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "quotes", label: "Quote", icon: ListOrdered },
    { id: "users", label: "Users", icon: Users },
    { id: "waitlist", label: "Waitlist", icon: Mail },
    { id: "gifts", label: "Hadiah", icon: Flower },
    { id: "giftroles", label: "Role Hadiah", icon: Gift },
    { id: "withdrawals", label: "Tarik Dana", icon: Wallet },
    { id: "topup", label: "Top Up", icon: ShoppingBag },
    { id: "betacodes", label: "Beta Code", icon: KeyRound },
    { id: "ads", label: "Iklan", icon: Megaphone },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-5 shadow-[8px_8px_0px_black] mb-6 flex items-center gap-3">
        <Shield className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-black">Admin Panel</h1>
          <p className="text-sm font-semibold text-black/70">KataViral Control Center</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-4 py-2 font-bold text-sm border-2 border-black rounded-lg transition-all ${tab === id ? "bg-black text-[#FFE34D] shadow-[3px_3px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"}`} data-testid={`tab-admin-${id}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "quotes" && <QuotesTab qc={qc} toast={toast} />}
      {tab === "users" && <UsersTab qc={qc} toast={toast} currentUserId={user.id} />}
      {tab === "waitlist" && <WaitlistTab qc={qc} toast={toast} />}
      {tab === "gifts" && <GiftsTab qc={qc} toast={toast} />}
      {tab === "giftroles" && <GiftRolesTab qc={qc} toast={toast} />}
      {tab === "withdrawals" && <WithdrawalsTab qc={qc} toast={toast} />}
      {tab === "topup" && <TopupTab qc={qc} toast={toast} />}
      {tab === "betacodes" && <BetaCodesTab qc={qc} toast={toast} />}
      {tab === "ads" && <AdsTab qc={qc} toast={toast} />}
      {tab === "settings" && <SettingsTab qc={qc} toast={toast} />}
    </div>
  );
}

function QuotesTab({ qc, toast }: any) {
  const { data: quotes = [], isLoading } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/admin/quotes"],
    queryFn: () => fetch("/api/admin/quotes", { credentials: "include" }).then((r) => r.json()),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/quotes/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/quotes"] }); toast({ title: "Status diperbarui!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <LoadingBox />;
  if (!quotes.length) return <EmptyBox msg="Tidak ada quote pending" />;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold text-sm text-gray-500">{quotes.length} quote menunggu review</p>
      {quotes.map((q) => {
        const mc = MOOD_COLORS[q.mood as Mood];
        return (
          <div key={q.id} className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]" data-testid={`card-admin-quote-${q.id}`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`text-xs font-black px-2 py-1 rounded border-2 border-black ${mc.bg} ${mc.text}`}>{MOOD_LABELS[q.mood as Mood]}</span>
              {q.tags.map((t) => <span key={t.id} className="text-xs font-bold px-2 py-1 bg-black text-white rounded">#{t.slug}</span>)}
            </div>
            <blockquote className="font-bold text-lg mb-1">&ldquo;{q.text}&rdquo;</blockquote>
            {q.author && <p className="text-sm text-gray-500 font-semibold mb-3">— {q.author}</p>}
            <div className="flex gap-2">
              <button onClick={() => updateStatus({ id: q.id, status: "approved" })} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 bg-[#A8FF78] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid={`button-approve-${q.id}`}>
                <Check className="w-4 h-4" /> Setujui
              </button>
              <button onClick={() => updateStatus({ id: q.id, status: "rejected" })} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 bg-[#FF7878] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid={`button-reject-${q.id}`}>
                <X className="w-4 h-4" /> Tolak
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsersTab({ qc, toast, currentUserId }: any) {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users", { credentials: "include" }).then((r) => r.json()),
  });

  const { mutate: update } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User diperbarui!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <LoadingBox />;
  if (!users.length) return <EmptyBox msg="Tidak ada user" />;

  return (
    <div className="flex flex-col gap-3">
      {users.map((u) => (
        <div key={u.id} className="border-3 border-black rounded-xl bg-white p-4 shadow-[4px_4px_0px_black]" data-testid={`row-user-${u.id}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-black">@{u.username}</p>
              <p className="text-sm text-gray-500 font-semibold">{u.email}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded border font-bold ${u.isActive ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"}`}>{u.isActive ? "Aktif" : "Nonaktif"}</span>
                <span className={`text-xs px-2 py-0.5 rounded border font-bold ${u.role === "admin" ? "bg-blue-100 border-blue-400" : "bg-gray-100 border-gray-300"}`}>{u.role}</span>
                {u.isGiveEnabled && <span className="text-xs px-2 py-0.5 rounded border border-pink-400 bg-pink-100 font-bold">Give ✓</span>}
              </div>
            </div>
            {u.id !== currentUserId && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => update({ id: u.id, data: { isActive: !u.isActive } })} className="px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all" data-testid={`button-toggle-user-${u.id}`}>
                  {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button onClick={() => update({ id: u.id, data: { isGiveEnabled: !u.isGiveEnabled } })} className="px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-pink-50 shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid={`button-toggle-give-${u.id}`}>
                  {u.isGiveEnabled ? "Non Give" : "Aktifkan Give"}
                </button>
              </div>
            )}
          </div>
          {u.isGiveEnabled && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
              <Flower className="w-3 h-3 text-pink-500" />
              <span className="text-sm font-bold">{u.flowersBalance} bunga</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WaitlistTab({ qc, toast }: any) {
  const { data: waitlist = [], isLoading } = useQuery<Waitlist[]>({
    queryKey: ["/api/admin/waitlist"],
    queryFn: () => fetch("/api/admin/waitlist", { credentials: "include" }).then((r) => r.json()),
  });

  const { mutate: update } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/waitlist/${id}`, { status }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/waitlist"] });
      if (data.betaCode) toast({ title: "Approved!", description: `Kode beta: ${data.betaCode}` });
      else toast({ title: "Status diperbarui!" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <LoadingBox />;
  if (!waitlist.length) return <EmptyBox msg="Waitlist kosong" />;

  return (
    <div className="flex flex-col gap-3">
      {waitlist.map((w) => (
        <div key={w.id} className="border-3 border-black rounded-xl bg-white p-4 shadow-[4px_4px_0px_black] flex items-center justify-between gap-4 flex-wrap" data-testid={`row-waitlist-${w.id}`}>
          <div>
            <p className="font-black text-sm">{w.name || "—"}</p>
            <p className="text-sm text-gray-500 font-semibold">{w.email}</p>
            <p className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString("id-ID")}</p>
            {w.betaCode && <p className="text-xs font-black text-green-700 mt-1">Kode: {w.betaCode}</p>}
          </div>
          <div className="flex gap-2">
            {w.status === "pending" ? (
              <>
                <button onClick={() => update({ id: w.id, status: "approved" })} className="px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-[#A8FF78] shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid={`button-approve-waitlist-${w.id}`}>
                  Approve
                </button>
                <button onClick={() => update({ id: w.id, status: "rejected" })} className="px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-[#FF7878] shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid={`button-reject-waitlist-${w.id}`}>
                  Reject
                </button>
              </>
            ) : (
              <span className={`text-xs font-black px-2 py-1 rounded border-2 ${w.status === "approved" ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"}`}>{w.status}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GiftsTab({ qc, toast }: any) {
  const [form, setForm] = useState({ name: "", icon: "flower", costFlowers: "10" });
  const { data: gifts = [], isLoading } = useQuery<GiftType[]>({
    queryKey: ["/api/admin/gifts"],
    queryFn: () => fetch("/api/admin/gifts", { credentials: "include" }).then((r) => r.json()),
  });

  const { mutate: create } = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/gifts", { ...form, costFlowers: parseInt(form.costFlowers) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/gifts"] }); toast({ title: "Hadiah ditambah!" }); setForm({ name: "", icon: "flower", costFlowers: "10" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <LoadingBox />;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-5 shadow-[6px_6px_0px_black]">
        <h3 className="font-black mb-3">Tambah Jenis Hadiah</h3>
        <div className="flex gap-2 flex-wrap">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama hadiah" className="px-3 py-2 border-2 border-black rounded-lg font-semibold text-sm flex-1 min-w-[120px]" data-testid="input-gift-name" />
          <input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="Icon (rose/star/diamond)" className="px-3 py-2 border-2 border-black rounded-lg font-semibold text-sm w-36" data-testid="input-gift-icon" />
          <input type="number" value={form.costFlowers} onChange={(e) => setForm((p) => ({ ...p, costFlowers: e.target.value }))} placeholder="Harga bunga" className="px-3 py-2 border-2 border-black rounded-lg font-semibold text-sm w-28" data-testid="input-gift-cost" />
          <button onClick={() => create()} disabled={!form.name} className="px-4 py-2 bg-black text-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_#333]" data-testid="button-add-gift">Tambah</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {gifts.map((g) => (
          <div key={g.id} className="border-3 border-black rounded-xl bg-white p-4 shadow-[4px_4px_0px_black] text-center" data-testid={`card-gift-${g.id}`}>
            <p className="text-3xl mb-2">{g.icon === "rose" ? "🌹" : g.icon === "star" ? "⭐" : g.icon === "diamond" ? "💎" : "🌸"}</p>
            <p className="font-black">{g.name}</p>
            <p className="text-sm text-gray-500 font-semibold">{g.costFlowers} bunga</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WithdrawalsTab({ qc, toast }: any) {
  const { data: requests = [], isLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: () => fetch("/api/admin/withdrawals", { credentials: "include" }).then((r) => r.json()),
  });

  const [notes, setNotes] = useState<Record<string, string>>({});

  const { mutate: update } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status, adminNote: notes[id] || "" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] }); toast({ title: "Status diperbarui!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <LoadingBox />;
  if (!requests.length) return <EmptyBox msg="Tidak ada permintaan penarikan" />;

  return (
    <div className="flex flex-col gap-4">
      {requests.map((req) => (
        <div key={req.id} className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]" data-testid={`card-withdrawal-${req.id}`}>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
            <div>
              <p className="font-black text-lg">{req.flowersAmount} bunga = Rp {req.idrAmount.toLocaleString("id-ID")}</p>
              <p className="text-sm text-gray-500 font-semibold">{req.accountName} • {req.accountNumber}</p>
              <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
            </div>
            <span className={`text-xs font-black px-2 py-1 rounded border-2 ${req.status === "pending" ? "bg-yellow-100 border-yellow-400" : req.status === "paid" ? "bg-green-100 border-green-400" : req.status === "approved" ? "bg-blue-100 border-blue-400" : "bg-red-100 border-red-400"}`}>{req.status}</span>
          </div>
          {req.status === "pending" && (
            <div className="flex flex-col gap-2">
              <input value={notes[req.id] || ""} onChange={(e) => setNotes((p) => ({ ...p, [req.id]: e.target.value }))} placeholder="Catatan admin (opsional)" className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid={`input-admin-note-${req.id}`} />
              <div className="flex gap-2">
                <button onClick={() => update({ id: req.id, status: "approved" })} className="px-4 py-2 bg-[#78C1FF] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black]" data-testid={`button-approve-withdrawal-${req.id}`}>Setujui</button>
                <button onClick={() => update({ id: req.id, status: "paid" })} className="px-4 py-2 bg-[#A8FF78] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black]" data-testid={`button-paid-withdrawal-${req.id}`}>Tandai Dibayar</button>
                <button onClick={() => update({ id: req.id, status: "rejected" })} className="px-4 py-2 bg-[#FF7878] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black]" data-testid={`button-reject-withdrawal-${req.id}`}>Tolak</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ qc, toast }: any) {
  const { data: s } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => fetch("/api/admin/settings", { credentials: "include" }).then((r) => r.json()),
  });

  const { mutate: save } = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => apiRequest("POST", "/api/admin/settings", { key, value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      qc.invalidateQueries({ queryKey: ["/api/settings/public"] });
      toast({ title: "Pengaturan disimpan!" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (!s) return <LoadingBox />;

  const isMaintenanceMode = s.maintenance_mode === "true";
  const isBetaMode = s.beta_mode === "true";
  const betaAccessType = s.beta_access_type || "open";

  return (
    <div className="flex flex-col gap-4">
      <SettingToggle label="Mode Maintenance" desc="Semua halaman ditampilkan sebagai halaman maintenance" icon={<Lock className="w-5 h-5" />} enabled={isMaintenanceMode} onChange={(v) => save({ key: "maintenance_mode", value: String(v) })} testId="toggle-maintenance" />
      <SettingToggle label="Mode Beta" desc="Aktifkan kontrol akses beta" icon={<Shield className="w-5 h-5" />} enabled={isBetaMode} onChange={(v) => save({ key: "beta_mode", value: String(v) })} testId="toggle-beta" />

      {isBetaMode && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          <h3 className="font-black mb-3">Tipe Akses Beta</h3>
          <div className="flex gap-2 flex-wrap">
            {[{ v: "open", l: "Terbuka" }, { v: "code", l: "Pakai Kode" }, { v: "waitlist", l: "Waitlist" }].map(({ v, l }) => (
              <button key={v} onClick={() => save({ key: "beta_access_type", value: v })} className={`px-4 py-2 border-2 border-black rounded-lg font-bold text-sm transition-all ${betaAccessType === v ? "bg-black text-[#FFE34D] shadow-[2px_2px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black]"}`} data-testid={`button-beta-type-${v}`}>
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-2">
            {betaAccessType === "open" ? "Semua orang bisa daftar" : betaAccessType === "code" ? "Hanya dengan kode beta valid" : "Hanya dari waitlist yang diapprove"}
          </p>
        </div>
      )}

      <NotificationSettings s={s} save={save} />
      <SiteInfoSettings s={s} save={save} />
      <TopupPaymentSettings s={s} save={save} />
    </div>
  );
}

function SettingToggle({ label, desc, icon, enabled, onChange, testId }: any) {
  return (
    <div className={`border-4 border-black rounded-xl p-5 shadow-[6px_6px_0px_black] transition-colors ${enabled ? "bg-[#FFE34D]" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 border-3 border-black rounded-lg flex items-center justify-center flex-shrink-0 ${enabled ? "bg-black text-[#FFE34D]" : "bg-gray-100"}`}>{icon}</div>
          <div>
            <h3 className="font-black">{label}</h3>
            <p className="text-sm font-semibold text-black/60">{desc}</p>
          </div>
        </div>
        <button onClick={() => onChange(!enabled)} className={`w-14 h-8 border-3 border-black rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-black" : "bg-gray-200"}`} data-testid={testId}>
          <span className={`absolute top-1 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${enabled ? "left-7" : "left-1"}`} />
        </button>
      </div>
    </div>
  );
}

function NotificationSettings({ s, save }: { s: Record<string, string>; save: (args: { key: string; value: string }) => void }) {
  const [msg, setMsg] = useState(s.notification_message || "");
  const [bg, setBg] = useState(s.notification_bg || "#FFE34D");
  const [textColor, setTextColor] = useState(s.notification_text_color || "#000000");
  const isEnabled = s.notification_enabled === "true";
  const currentType = s.notification_type || "banner";

  const PRESETS = [
    { bg: "#FFE34D", text: "#000000", label: "Kuning" },
    { bg: "#A8FF78", text: "#000000", label: "Hijau" },
    { bg: "#78C1FF", text: "#000000", label: "Biru" },
    { bg: "#FF7878", text: "#ffffff", label: "Merah" },
    { bg: "#000000", text: "#FFE34D", label: "Hitam" },
    { bg: "#ffffff", text: "#000000", label: "Putih" },
  ];

  return (
    <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black">Notifikasi Situs</h3>
          <p className="text-xs text-gray-500 font-semibold">Banner atas halaman atau popup di tengah layar</p>
        </div>
        <button
          onClick={() => save({ key: "notification_enabled", value: String(!isEnabled) })}
          className={`w-14 h-8 border-3 border-black rounded-full transition-colors relative flex-shrink-0 ${isEnabled ? "bg-black" : "bg-gray-200"}`}
          data-testid="toggle-notification"
        >
          <span className={`absolute top-1 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${isEnabled ? "left-7" : "left-1"}`} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="font-black text-xs uppercase tracking-wide text-gray-500 mb-2 block">Tipe</label>
          <div className="flex gap-2">
            {[{ v: "banner", l: "🔔 Banner (atas halaman)" }, { v: "popup", l: "💬 Popup (tengah layar)" }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => save({ key: "notification_type", value: v })}
                className={`flex-1 px-3 py-2 border-2 border-black rounded-lg font-bold text-xs transition-all ${currentType === v ? "bg-black text-[#FFE34D] shadow-[2px_2px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black]"}`}
                data-testid={`button-notif-type-${v}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-black text-xs uppercase tracking-wide text-gray-500 mb-1 block">Pesan</label>
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Tulis pesan notifikasi..."
              className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold focus:outline-none"
              data-testid="input-notification-message"
            />
            <button
              onClick={() => save({ key: "notification_message", value: msg })}
              className="px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all"
              data-testid="button-save-notification-message"
            >
              Simpan
            </button>
          </div>
        </div>

        <div>
          <label className="font-black text-xs uppercase tracking-wide text-gray-500 mb-2 block">Warna Preset</label>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.bg}
                onClick={() => {
                  setBg(p.bg);
                  setTextColor(p.text);
                  save({ key: "notification_bg", value: p.bg });
                  save({ key: "notification_text_color", value: p.text });
                }}
                className="w-8 h-8 border-2 border-black rounded-lg shadow-[2px_2px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                style={{ backgroundColor: p.bg }}
                title={p.label}
                data-testid={`button-notif-color-${p.label}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="font-black text-xs uppercase tracking-wide text-gray-500 mb-1 block">Warna BG</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="w-10 h-10 border-2 border-black rounded-lg cursor-pointer p-0.5"
                data-testid="input-notif-bg-color"
              />
              <input
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="flex-1 px-2 py-1.5 border-2 border-black rounded-lg text-xs font-mono font-bold"
                data-testid="input-notif-bg-hex"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="font-black text-xs uppercase tracking-wide text-gray-500 mb-1 block">Warna Teks</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-10 border-2 border-black rounded-lg cursor-pointer p-0.5"
                data-testid="input-notif-text-color"
              />
              <input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 px-2 py-1.5 border-2 border-black rounded-lg text-xs font-mono font-bold"
                data-testid="input-notif-text-hex"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            save({ key: "notification_bg", value: bg });
            save({ key: "notification_text_color", value: textColor });
          }}
          className="py-2 bg-[#78C1FF] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all"
          data-testid="button-save-notif-colors"
        >
          Simpan Warna
        </button>

        {s.notification_message && (
          <div className="mt-1">
            <label className="font-black text-xs uppercase tracking-wide text-gray-500 mb-2 block">Preview</label>
            <div
              className="border-3 border-black rounded-lg px-4 py-2.5 flex items-center gap-2 font-black text-sm shadow-[4px_4px_0px_black]"
              style={{ backgroundColor: bg, color: textColor }}
            >
              🔔 {s.notification_message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SiteInfoSettings({ s, save }: { s: Record<string, string>; save: (args: { key: string; value: string }) => void }) {
  const [siteName, setSiteName] = useState(s.site_name || "");
  const [siteDesc, setSiteDesc] = useState(s.site_description || "");
  return (
    <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
      <h3 className="font-black mb-3">Info Site</h3>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-bold text-xs text-gray-500 mb-1 block">Nama Site</label>
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-setting-site_name" />
          </div>
          <button onClick={() => save({ key: "site_name", value: siteName })} className="px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid="button-save-setting-site_name">Simpan</button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-bold text-xs text-gray-500 mb-1 block">Deskripsi</label>
            <input value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-setting-site_description" />
          </div>
          <button onClick={() => save({ key: "site_description", value: siteDesc })} className="px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid="button-save-setting-site_description">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function TopupPaymentSettings({ s, save }: { s: Record<string, string>; save: (args: { key: string; value: string }) => void }) {
  const [bankName, setBankName] = useState(s.topup_bank_name || "");
  const [accountNumber, setAccountNumber] = useState(s.topup_account_number || "");
  const [accountName, setAccountName] = useState(s.topup_account_name || "");
  return (
    <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
      <h3 className="font-black mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Info Pembayaran Top Up</h3>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-bold text-xs text-gray-500 mb-1 block">Nama Bank/E-Wallet</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Contoh: BCA, GoPay" className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-setting-topup_bank_name" />
          </div>
          <button onClick={() => save({ key: "topup_bank_name", value: bankName })} className="px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black]" data-testid="button-save-topup-bank">Simpan</button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-bold text-xs text-gray-500 mb-1 block">Nomor Rekening/Akun</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Nomor rekening" className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-setting-topup_account_number" />
          </div>
          <button onClick={() => save({ key: "topup_account_number", value: accountNumber })} className="px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black]" data-testid="button-save-topup-account-number">Simpan</button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-bold text-xs text-gray-500 mb-1 block">Nama Pemilik Rekening</label>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Nama pemilik" className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-setting-topup_account_name" />
          </div>
          <button onClick={() => save({ key: "topup_account_name", value: accountName })} className="px-3 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black]" data-testid="button-save-topup-account-name">Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ─── TOPUP TAB ────────────────────────────────────────────

function TopupTab({ qc, toast }: { qc: ReturnType<typeof useQueryClient>; toast: ReturnType<typeof useToast>["toast"] }) {
  const [subtab, setSubtab] = useState<"requests" | "packages">("requests");
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [newPkg, setNewPkg] = useState({ name: "", icon: "🌸", description: "", flowersAmount: "", priceIdr: "", sortOrder: "0" });

  const { data: requests = [], isLoading: reqLoading } = useQuery<TopupRequest[]>({
    queryKey: ["/api/admin/topup/requests"],
    queryFn: () => fetch("/api/admin/topup/requests", { credentials: "include" }).then((r) => r.json()),
  });

  const { data: packages = [], isLoading: pkgLoading } = useQuery<TopupPackage[]>({
    queryKey: ["/api/admin/topup/packages"],
    queryFn: () => fetch("/api/admin/topup/packages", { credentials: "include" }).then((r) => r.json()),
  });

  const updateReq = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      apiRequest("PATCH", `/api/admin/topup/requests/${id}`, { status, adminNote }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/topup/requests"] }); toast({ title: "Status diperbarui!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const addPkg = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/topup/packages", {
      ...newPkg, flowersAmount: parseInt(newPkg.flowersAmount), priceIdr: parseInt(newPkg.priceIdr), sortOrder: parseInt(newPkg.sortOrder),
    }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/topup/packages"] }); setNewPkg({ name: "", icon: "🌸", description: "", flowersAmount: "", priceIdr: "", sortOrder: "0" }); toast({ title: "Paket ditambahkan!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const togglePkg = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiRequest("PATCH", `/api/admin/topup/packages/${id}`, { isActive }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/topup/packages"] }),
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-400",
    confirmed: "bg-green-100 text-green-700 border-green-400",
    rejected: "bg-red-100 text-red-700 border-red-400",
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["requests", "packages"] as const).map((s) => (
          <button key={s} onClick={() => setSubtab(s)} className={`px-4 py-2 font-bold text-sm border-2 border-black rounded-lg transition-all ${subtab === s ? "bg-black text-[#FFE34D]" : "bg-white shadow-[2px_2px_0px_black]"}`} data-testid={`tab-topup-${s}`}>
            {s === "requests" ? "Permintaan" : "Paket"}
          </button>
        ))}
      </div>

      {subtab === "requests" && (
        reqLoading ? <LoadingBox /> : requests.length === 0 ? <EmptyBox msg="Belum ada permintaan top up" /> :
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <div key={req.id} className="border-4 border-black rounded-xl bg-white p-4 shadow-[4px_4px_0px_black]" data-testid={`row-topupreq-${req.id}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-black">🌸 {req.flowersAmount} bunga · Rp {req.priceIdr.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-gray-400">User: {req.userId}</p>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded border ${STATUS_COLORS[req.status] || "bg-gray-100 border-gray-300"}`}>{req.status}</span>
              </div>
              {req.status === "pending" && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <input
                    placeholder="Catatan admin (opsional)"
                    value={noteInputs[req.id] || ""}
                    onChange={(e) => setNoteInputs((n) => ({ ...n, [req.id]: e.target.value }))}
                    className="flex-1 px-2 py-1.5 border-2 border-gray-300 rounded-lg text-sm font-semibold min-w-0"
                    data-testid={`input-topupreq-note-${req.id}`}
                  />
                  <button onClick={() => updateReq.mutate({ id: req.id, status: "confirmed", adminNote: noteInputs[req.id] })}
                    className="px-3 py-1.5 bg-green-100 border-2 border-green-500 rounded-lg font-black text-xs text-green-700 shadow-[2px_2px_0px_#16a34a]" data-testid={`button-topupreq-confirm-${req.id}`}>
                    <Check className="w-3 h-3 inline mr-1" />Konfirmasi
                  </button>
                  <button onClick={() => updateReq.mutate({ id: req.id, status: "rejected", adminNote: noteInputs[req.id] })}
                    className="px-3 py-1.5 bg-red-100 border-2 border-red-500 rounded-lg font-black text-xs text-red-700 shadow-[2px_2px_0px_#dc2626]" data-testid={`button-topupreq-reject-${req.id}`}>
                    <X className="w-3 h-3 inline mr-1" />Tolak
                  </button>
                </div>
              )}
              {req.adminNote && <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">Catatan: {req.adminNote}</p>}
            </div>
          ))}
        </div>
      )}

      {subtab === "packages" && (
        <div className="flex flex-col gap-4">
          <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-4 shadow-[5px_5px_0px_black]">
            <h3 className="font-black mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Paket</h3>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nama paket" value={newPkg.name} onChange={(e) => setNewPkg((p) => ({ ...p, name: e.target.value }))} className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-newpkg-name" />
              <input placeholder="Icon (emoji)" value={newPkg.icon} onChange={(e) => setNewPkg((p) => ({ ...p, icon: e.target.value }))} className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-newpkg-icon" />
              <input placeholder="Jumlah bunga" type="number" value={newPkg.flowersAmount} onChange={(e) => setNewPkg((p) => ({ ...p, flowersAmount: e.target.value }))} className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-newpkg-flowers" />
              <input placeholder="Harga (Rp)" type="number" value={newPkg.priceIdr} onChange={(e) => setNewPkg((p) => ({ ...p, priceIdr: e.target.value }))} className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold" data-testid="input-newpkg-price" />
              <input placeholder="Deskripsi" value={newPkg.description} onChange={(e) => setNewPkg((p) => ({ ...p, description: e.target.value }))} className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold col-span-2" data-testid="input-newpkg-description" />
            </div>
            <button onClick={() => addPkg.mutate()} disabled={addPkg.isPending || !newPkg.name || !newPkg.flowersAmount || !newPkg.priceIdr}
              className="mt-2 px-4 py-2 bg-black text-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_#FFE34D] disabled:opacity-50" data-testid="button-newpkg-add">
              {addPkg.isPending ? "..." : "Tambah Paket"}
            </button>
          </div>

          {pkgLoading ? <LoadingBox /> : packages.length === 0 ? <EmptyBox msg="Belum ada paket" /> : (
            <div className="grid grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="border-3 border-black rounded-xl bg-white p-4 shadow-[4px_4px_0px_black]" data-testid={`card-pkg-${pkg.id}`}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-2xl">{pkg.icon}</span>
                    <button onClick={() => togglePkg.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                      className={`text-xs font-black px-2 py-1 rounded border-2 ${pkg.isActive ? "border-green-400 text-green-700 bg-green-50" : "border-gray-300 text-gray-400 bg-gray-50"}`}>
                      {pkg.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                  <p className="font-black text-sm">{pkg.name}</p>
                  <p className="font-bold text-xs text-gray-500">🌸 {pkg.flowersAmount} · Rp {pkg.priceIdr.toLocaleString("id-ID")}</p>
                  {pkg.description && <p className="text-xs text-gray-400 mt-1">{pkg.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BETA CODES TAB ───────────────────────────────────────

function BetaCodesTab({ qc, toast }: { qc: ReturnType<typeof useQueryClient>; toast: ReturnType<typeof useToast>["toast"] }) {
  const { data: codes = [], isLoading } = useQuery<BetaCode[]>({
    queryKey: ["/api/admin/beta-codes"],
    queryFn: () => fetch("/api/admin/beta-codes", { credentials: "include" }).then((r) => r.json()),
  });

  const generate = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/beta-codes/generate").then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/beta-codes"] }); toast({ title: "Kode beta baru dibuat!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Disalin!", description: code });
  };

  return (
    <div>
      <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-5 shadow-[6px_6px_0px_black] mb-4">
        <h3 className="font-black text-lg mb-2 flex items-center gap-2"><KeyRound className="w-5 h-5" /> Generator Kode Beta</h3>
        <p className="text-sm font-semibold text-black/70 mb-3">Buat kode unik untuk mengundang pengguna beta baru</p>
        <button onClick={() => generate.mutate()} disabled={generate.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-[#FFE34D] border-2 border-black rounded-lg font-black shadow-[4px_4px_0px_#FFE34D] hover:shadow-[2px_2px_0px_#FFE34D] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          data-testid="button-generate-betacode">
          <Plus className="w-4 h-4" /> {generate.isPending ? "Membuat..." : "Buat Kode Baru"}
        </button>
      </div>

      {isLoading ? <LoadingBox /> : codes.length === 0 ? <EmptyBox msg="Belum ada kode beta" /> : (
        <div className="border-4 border-black rounded-xl bg-white shadow-[6px_6px_0px_black] overflow-hidden">
          <div className="grid grid-cols-3 gap-0 bg-black text-[#FFE34D] text-xs font-black uppercase px-4 py-2">
            <span>Kode</span>
            <span>Status</span>
            <span>Dibuat</span>
          </div>
          {codes.map((bc) => (
            <div key={bc.id} className="grid grid-cols-3 gap-0 px-4 py-3 border-t-2 border-gray-100 items-center" data-testid={`row-betacode-${bc.id}`}>
              <div className="flex items-center gap-2">
                <span className="font-black font-mono text-sm tracking-wider">{bc.code}</span>
                <button onClick={() => copyCode(bc.code)} className="p-1 hover:bg-gray-100 rounded" data-testid={`button-copy-code-${bc.id}`}>
                  <Copy className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded border w-fit ${bc.isUsed ? "bg-gray-100 border-gray-300 text-gray-500" : "bg-green-50 border-green-400 text-green-700"}`}>
                {bc.isUsed ? "Digunakan" : "Tersedia"}
              </span>
              <span className="text-xs text-gray-400">{new Date(bc.createdAt).toLocaleDateString("id-ID")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GiftRolesTab({ qc, toast }: any) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data: apps = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/gift-role"],
    queryFn: async () => {
      const r = await fetch("/api/admin/gift-role", { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const { mutate: update, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/gift-role/${id}`, { status, adminNote: notes[id] || "" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/gift-role"] }); toast({ title: "Status diperbarui!" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const TYPE_LABELS: Record<string, string> = { giver: "Pemberi", receiver: "Penerima", both: "Pemberi & Penerima" };
  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-yellow-100 border-yellow-400 text-yellow-800",
    approved: "bg-green-100 border-green-400 text-green-800",
    rejected: "bg-red-100 border-red-400 text-red-800",
  };

  if (isLoading) return <LoadingBox />;
  if (apps.length === 0) return <EmptyBox msg="Belum ada pengajuan role hadiah" />;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold text-sm text-black/60">{apps.length} pengajuan</p>
      {apps.map((app) => (
        <div key={app.id} className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]" data-testid={`card-giftrole-${app.id}`}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-black">@{app.username || app.userId}</p>
              <p className="text-xs text-gray-400">{app.email}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 bg-[#FFE34D] border border-black rounded">{TYPE_LABELS[app.type] ?? app.type}</span>
                <span className={`text-xs font-bold px-2 py-0.5 border rounded ${STATUS_STYLES[app.status]}`}>{app.status}</span>
              </div>
            </div>
            <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString("id-ID")}</span>
          </div>
          <p className="text-sm text-gray-700 border-l-2 border-gray-300 pl-2 italic mb-3">"{app.reason}"</p>
          {app.socialLink && (
            <a href={app.socialLink} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 underline mb-3 block">{app.socialLink}</a>
          )}
          {app.adminNote && (
            <p className="text-xs bg-gray-50 border border-gray-200 rounded p-2 mb-3">Catatan: {app.adminNote}</p>
          )}
          {app.status === "pending" && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Catatan admin (opsional)"
                value={notes[app.id] || ""}
                onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
                className="border-2 border-black rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none w-full"
                data-testid={`input-admin-note-${app.id}`}
              />
              <div className="flex gap-2">
                <button onClick={() => update({ id: app.id, status: "approved" })} disabled={isPending} className="flex-1 px-4 py-2 bg-[#A8FF78] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50" data-testid={`button-approve-giftrole-${app.id}`}>
                  <Check className="w-4 h-4 inline mr-1" /> Setujui
                </button>
                <button onClick={() => update({ id: app.id, status: "rejected" })} disabled={isPending} className="flex-1 px-4 py-2 bg-[#FF7878] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50" data-testid={`button-reject-giftrole-${app.id}`}>
                  <X className="w-4 h-4 inline mr-1" /> Tolak
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingBox() {
  return <div className="border-4 border-black rounded-xl h-40 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" />;
}

function EmptyBox({ msg }: { msg: string }) {
  return (
    <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-8 text-center shadow-[6px_6px_0px_black]">
      <Clock className="w-12 h-12 mx-auto mb-2 opacity-40" />
      <p className="font-black">{msg}</p>
    </div>
  );
}

const BLANK_AD: Partial<Ad> = { type: "text", title: "", description: "", imageUrl: "", linkUrl: "", isActive: true, position: "inline", bgColor: "#78C1FF", textColor: "#000000", sortOrder: 0 };
const COLOR_PRESETS = [
  { color: "#FFE34D", label: "Kuning" },
  { color: "#78C1FF", label: "Biru" },
  { color: "#A8FF78", label: "Hijau" },
  { color: "#FF7878", label: "Merah" },
  { color: "#E8D5FF", label: "Ungu" },
  { color: "#FFFFFF", label: "Putih" },
  { color: "#1a1a1a", label: "Hitam" },
];

function AdsTab({ qc, toast }: { qc: ReturnType<typeof useQueryClient>; toast: ReturnType<typeof useToast>["toast"] }) {
  const [form, setForm] = useState<Partial<Ad>>({ ...BLANK_AD });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: allAds = [], isLoading } = useQuery<Ad[]>({
    queryKey: ["/api/admin/ads"],
    queryFn: async () => {
      const r = await fetch("/api/admin/ads", { credentials: "include" });
      if (!r.ok) return [];
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    },
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => editId
      ? apiRequest("PATCH", `/api/admin/ads/${editId}`, form)
      : apiRequest("POST", "/api/admin/ads", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      qc.invalidateQueries({ queryKey: ["/api/ads"] });
      toast({ title: editId ? "Iklan diperbarui!" : "Iklan ditambahkan!" });
      setForm({ ...BLANK_AD });
      setEditId(null);
      setShowForm(false);
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/ads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      qc.invalidateQueries({ queryKey: ["/api/ads"] });
      toast({ title: "Iklan dihapus!" });
    },
    onError: (e: any) => toast({ title: "Gagal hapus", description: e.message, variant: "destructive" }),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiRequest("PATCH", `/api/admin/ads/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      qc.invalidateQueries({ queryKey: ["/api/ads"] });
    },
  });

  function startEdit(ad: Ad) {
    setForm({ type: ad.type, title: ad.title || "", description: ad.description || "", imageUrl: ad.imageUrl || "", linkUrl: ad.linkUrl || "", isActive: ad.isActive, position: ad.position, bgColor: ad.bgColor, textColor: ad.textColor, sortOrder: ad.sortOrder });
    setEditId(ad.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm({ ...BLANK_AD });
    setEditId(null);
    setShowForm(false);
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-black uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );

  const inputCls = "border-2 border-black rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none bg-white w-full";

  if (isLoading) return <LoadingBox />;

  return (
    <div className="flex flex-col gap-5">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-add-ad"
          className="flex items-center gap-2 px-5 py-3 bg-[#FFE34D] border-3 border-black rounded-xl font-black text-sm shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all w-fit"
        >
          <Plus className="w-4 h-4" /> Tambah Iklan Baru
        </button>
      )}

      {showForm && (
        <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[6px_6px_0px_black]">
          <h2 className="font-black text-lg mb-5 flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {editId ? "Edit Iklan" : "Tambah Iklan Baru"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Tipe">
              <div className="flex gap-2">
                {(["text", "image"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 border-2 border-black rounded-lg font-bold text-sm transition-all ${form.type === t ? "bg-black text-[#FFE34D]" : "bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black]"}`}
                    data-testid={`button-ad-type-${t}`}
                  >
                    {t === "text" ? "Teks" : "Gambar"}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Posisi">
              <div className="flex gap-2">
                {(["inline", "bottom"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, position: p })}
                    className={`flex-1 py-2 border-2 border-black rounded-lg font-bold text-sm transition-all ${form.position === p ? "bg-black text-[#FFE34D]" : "bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black]"}`}
                    data-testid={`button-ad-pos-${p}`}
                  >
                    {p === "inline" ? "Di antara Quote" : "Bawah Halaman"}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Judul">
              <input type="text" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul iklan..." className={inputCls} data-testid="input-ad-title" />
            </Field>

            <Field label="Link URL">
              <input type="url" value={form.linkUrl || ""} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." className={inputCls} data-testid="input-ad-link" />
            </Field>

            {form.type === "image" && (
              <Field label="URL Gambar">
                <input type="url" value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className={inputCls} data-testid="input-ad-image" />
              </Field>
            )}

            <Field label="Urutan (sort)">
              <input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputCls} data-testid="input-ad-sort" />
            </Field>
          </div>

          <Field label="Deskripsi">
            <textarea rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat iklan..." className={`${inputCls} resize-none`} data-testid="input-ad-desc" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest block mb-2">Warna Background</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setForm({ ...form, bgColor: p.color })}
                    title={p.label}
                    className={`w-7 h-7 rounded-md border-2 transition-all ${form.bgColor === p.color ? "border-black scale-110 shadow-[2px_2px_0px_black]" : "border-gray-300"}`}
                    style={{ backgroundColor: p.color }}
                    data-testid={`button-ad-bg-${p.label.toLowerCase()}`}
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.bgColor || "#78C1FF"} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="w-10 h-10 border-2 border-black rounded-md cursor-pointer" data-testid="input-ad-bg-color" />
                <input type="text" value={form.bgColor || ""} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="border-2 border-black rounded-lg px-3 py-2 text-sm font-mono w-full" data-testid="input-ad-bg-hex" />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest block mb-2">Warna Teks</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[{ color: "#000000", label: "Hitam" }, { color: "#FFFFFF", label: "Putih" }, { color: "#1a1a1a", label: "Gelap" }].map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setForm({ ...form, textColor: p.color })}
                    title={p.label}
                    className={`w-7 h-7 rounded-md border-2 transition-all ${form.textColor === p.color ? "border-yellow-400 scale-110" : "border-gray-300"}`}
                    style={{ backgroundColor: p.color }}
                    data-testid={`button-ad-text-${p.label.toLowerCase()}`}
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.textColor || "#000000"} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="w-10 h-10 border-2 border-black rounded-md cursor-pointer" data-testid="input-ad-text-color" />
                <input type="text" value={form.textColor || ""} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="border-2 border-black rounded-lg px-3 py-2 text-sm font-mono w-full" data-testid="input-ad-text-hex" />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 border-2 border-dashed border-black rounded-xl" style={{ backgroundColor: form.bgColor }}>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: form.textColor || "#000" }}>Preview</p>
            {form.type === "image" && form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="w-full max-h-32 object-cover rounded-lg mb-2 border-2 border-black" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            {form.title && <p className="font-black text-sm" style={{ color: form.textColor || "#000" }}>{form.title}</p>}
            {form.description && <p className="text-xs font-semibold mt-1 opacity-80" style={{ color: form.textColor || "#000" }}>{form.description}</p>}
            {form.linkUrl && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-black border-2 border-black px-3 py-1 rounded-md bg-white shadow-[2px_2px_0px_black]">
                <ExternalLink className="w-3 h-3" /> Kunjungi
              </span>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => save()}
              disabled={saving}
              data-testid="button-save-ad"
              className="flex-1 py-3 bg-[#A8FF78] border-3 border-black rounded-xl font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : (editId ? "Perbarui Iklan" : "Simpan Iklan")}
            </button>
            <button onClick={cancelEdit} className="px-5 py-3 bg-white border-3 border-black rounded-xl font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-cancel-ad">
              Batal
            </button>
          </div>
        </div>
      )}

      {allAds.length === 0 && !showForm && <EmptyBox msg="Belum ada iklan. Tambahkan iklan pertama!" />}

      <div className="flex flex-col gap-4">
        {allAds.map((ad) => (
          <div key={ad.id} className={`border-4 border-black rounded-xl shadow-[6px_6px_0px_black] overflow-hidden ${!ad.isActive ? "opacity-60" : ""}`} style={{ backgroundColor: ad.bgColor }} data-testid={`card-ad-${ad.id}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-black/10">
              <div className="flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5" style={{ color: ad.textColor }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: ad.textColor }}>{ad.type === "image" ? "Gambar" : "Teks"} · {ad.position === "inline" ? "Di antara quote" : "Bawah halaman"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-70" style={{ color: ad.textColor }}>{ad.clickCount} klik</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md border-2 border-black ${ad.isActive ? "bg-[#A8FF78]" : "bg-gray-200"}`}>{ad.isActive ? "Aktif" : "Nonaktif"}</span>
              </div>
            </div>
            <div className="p-4 flex items-start gap-4">
              {ad.type === "image" && ad.imageUrl && (
                <img src={ad.imageUrl} alt="ad" className="w-20 h-16 object-cover rounded-lg border-2 border-black flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="flex-1 min-w-0">
                {ad.title && <p className="font-black text-sm truncate" style={{ color: ad.textColor }}>{ad.title}</p>}
                {ad.description && <p className="text-xs opacity-75 mt-0.5 line-clamp-2" style={{ color: ad.textColor }}>{ad.description}</p>}
                {ad.linkUrl && <p className="text-xs font-mono mt-1 opacity-60 truncate" style={{ color: ad.textColor }}>{ad.linkUrl}</p>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => toggle({ id: ad.id, isActive: !ad.isActive })} className="px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all whitespace-nowrap" data-testid={`button-toggle-ad-${ad.id}`}>
                  {ad.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button onClick={() => startEdit(ad)} className="flex items-center gap-1 px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-[#FFE34D] shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid={`button-edit-ad-${ad.id}`}>
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => { if (confirm("Hapus iklan ini?")) remove(ad.id); }} disabled={removing} className="flex items-center gap-1 px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold bg-[#FF7878] shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all disabled:opacity-50" data-testid={`button-delete-ad-${ad.id}`}>
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
