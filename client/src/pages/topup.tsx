import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flower, Star, Diamond, ArrowLeft, Clock, Check, X, Copy, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TopupPackage, TopupRequest } from "@shared/schema";

const ICON_MAP: Record<string, string> = {
  "🌸": "🌸", "⭐": "⭐", "💎": "💎", "🚀": "🚀", "🌺": "🌺",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu Konfirmasi", color: "bg-yellow-100 text-yellow-700 border-yellow-400" },
  confirmed: { label: "Berhasil", color: "bg-green-100 text-green-700 border-green-400" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700 border-red-400" },
};

export default function Topup() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  const { data: packages = [] } = useQuery<TopupPackage[]>({
    queryKey: ["/api/topup/packages"],
    queryFn: () => fetch("/api/topup/packages").then((r) => r.json()),
  });

  const { data: myRequests = [] } = useQuery<TopupRequest[]>({
    queryKey: ["/api/topup/my"],
    queryFn: () => fetch("/api/topup/my", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  const { data: paymentInfo } = useQuery<{ bankName?: string; accountNumber?: string; accountName?: string }>({
    queryKey: ["/api/topup/payment-info"],
    queryFn: () => fetch("/api/topup/payment-info").then((r) => r.json()),
  });

  const { mutate: createRequest, isPending } = useMutation({
    mutationFn: (packageId: string) => apiRequest("POST", "/api/topup/request", { packageId }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Permintaan top-up dikirim!", description: "Transfer sesuai nominal lalu konfirmasi ke admin" });
      qc.invalidateQueries({ queryKey: ["/api/topup/my"] });
      setStep("select");
      setSelectedPkg("");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (authLoading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 border-4 border-black rounded-xl bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" /></div>;
  if (!user) { navigate("/auth"); return null; }

  const selected = packages.find((p) => p.id === selectedPkg);
  const hasBankInfo = paymentInfo?.bankName && paymentInfo?.accountNumber;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Disalin!" });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Link href="/profile">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black px-4 py-2 rounded-lg bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back-topup">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </Link>

      <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-5 shadow-[8px_8px_0px_black] mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">🌸 Top Up Bunga</h1>
        <p className="font-semibold text-sm text-black/70">Beli bunga untuk dikirim sebagai hadiah ke penulis quote favorit kamu</p>
        <div className="flex items-center gap-2 mt-2 bg-white/70 border-2 border-black rounded-lg px-3 py-2 w-fit">
          <Flower className="w-4 h-4 text-pink-500" />
          <span className="font-black">{user.flowersBalance}</span>
          <span className="text-sm font-semibold text-gray-500">bunga saat ini</span>
        </div>
      </div>

      {!hasBankInfo && (
        <div className="border-3 border-yellow-400 rounded-xl bg-yellow-50 p-4 mb-5 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-yellow-800">Info pembayaran belum dikonfigurasi admin. Hubungi admin untuk top up.</p>
        </div>
      )}

      {step === "select" && (
        <>
          <div className="mb-4">
            <h2 className="font-black text-sm uppercase tracking-widest mb-3">Pilih Paket</h2>
            <div className="grid grid-cols-2 gap-3">
              {packages.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`flex flex-col gap-1.5 p-4 border-3 border-black rounded-xl text-left transition-all ${selectedPkg === pkg.id ? "bg-[#FFE34D] shadow-[3px_3px_0px_black] translate-x-[3px] translate-y-[3px]" : "bg-white shadow-[6px_6px_0px_black] hover:shadow-[3px_3px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px]"}`}
                  data-testid={`button-pkg-${pkg.id}`}
                >
                  <span className="text-3xl">{pkg.icon}</span>
                  <span className="font-black text-sm">{pkg.name}</span>
                  <span className="font-black text-xl">🌸 {pkg.flowersAmount.toLocaleString("id-ID")}</span>
                  <span className="text-sm font-bold text-gray-600">Rp {pkg.priceIdr.toLocaleString("id-ID")}</span>
                  {pkg.description && <span className="text-xs text-gray-500 font-medium">{pkg.description}</span>}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { if (!selectedPkg) { toast({ title: "Pilih paket dulu" }); return; } setStep("confirm"); }}
            disabled={!selectedPkg}
            className="w-full py-3 bg-black text-[#FFE34D] border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_#FFE34D] hover:shadow-[2px_2px_0px_#FFE34D] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 text-sm"
            data-testid="button-topup-next"
          >
            Lanjutkan ke Pembayaran →
          </button>
        </>
      )}

      {step === "confirm" && selected && (
        <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[8px_8px_0px_black]">
          <h2 className="font-black text-lg mb-4">Konfirmasi Top Up</h2>
          <div className="bg-[#FFE34D] border-2 border-black rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{selected.icon}</span>
              <span className="font-black text-lg">{selected.name}</span>
            </div>
            <p className="font-bold text-sm">🌸 {selected.flowersAmount.toLocaleString("id-ID")} bunga</p>
            <p className="font-black text-xl mt-1">Rp {selected.priceIdr.toLocaleString("id-ID")}</p>
          </div>

          {hasBankInfo && (
            <div className="border-2 border-black rounded-lg p-4 mb-4 bg-gray-50">
              <p className="font-black text-sm mb-2">Transfer ke:</p>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">{paymentInfo!.bankName}</p>
                  <p className="font-black text-lg">{paymentInfo!.accountNumber}</p>
                  <p className="text-sm font-semibold text-gray-600">{paymentInfo!.accountName}</p>
                </div>
                <button onClick={() => copyToClipboard(paymentInfo!.accountNumber!)} className="p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_black]">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500">Transfer tepat:</p>
                <p className="font-black text-lg text-green-700">Rp {selected.priceIdr.toLocaleString("id-ID")}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-4 text-xs font-semibold text-blue-700">
            Setelah transfer, klik tombol di bawah. Admin akan memverifikasi dan menambahkan bunga dalam 1×24 jam.
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep("select")} className="flex-1 py-2.5 border-2 border-black rounded-lg font-bold text-sm bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all" data-testid="button-topup-back">
              ← Ubah
            </button>
            <button onClick={() => createRequest(selectedPkg)} disabled={isPending || !hasBankInfo} className="flex-2 px-6 py-2.5 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50" data-testid="button-topup-confirm">
              {isPending ? "Memproses..." : "Sudah Transfer ✓"}
            </button>
          </div>
        </div>
      )}

      {myRequests.length > 0 && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mt-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Riwayat Top Up</h2>
          <div className="flex flex-col gap-3">
            {myRequests.map((req) => {
              const s = STATUS_MAP[req.status] || { label: req.status, color: "bg-gray-100 text-gray-600 border-gray-300" };
              return (
                <div key={req.id} className="border-2 border-black rounded-lg p-4" data-testid={`row-topup-${req.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-sm">🌸 {req.flowersAmount} bunga</p>
                      <p className="text-sm font-bold text-gray-500">Rp {req.priceIdr.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded border ${s.color}`}>{s.label}</span>
                  </div>
                  {req.adminNote && <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{req.adminNote}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
