import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flower, ArrowLeft, Clock, Check, X, ExternalLink, RefreshCw, AlertCircle, QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TopupPackage, TopupRequest } from "@shared/schema";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700 border-yellow-400", icon: Clock },
  confirmed: { label: "Berhasil", color: "bg-green-100 text-green-700 border-green-400", icon: Check },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700 border-red-400", icon: X },
};

export default function Topup() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [step, setStep] = useState<"select" | "payment">("select");
  const [activeRequest, setActiveRequest] = useState<TopupRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: packages = [] } = useQuery<TopupPackage[]>({
    queryKey: ["/api/topup/packages"],
    queryFn: () => fetch("/api/topup/packages").then((r) => r.json()),
  });

  const { data: myRequests = [] } = useQuery<TopupRequest[]>({
    queryKey: ["/api/topup/my"],
    queryFn: () => fetch("/api/topup/my", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  const { mutate: createRequest, isPending } = useMutation({
    mutationFn: (packageId: string) => apiRequest("POST", "/api/topup/request", { packageId }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      setActiveRequest(data);
      setStep("payment");
      qc.invalidateQueries({ queryKey: ["/api/topup/my"] });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (step === "payment" && activeRequest?.invoiceId) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/topup/check/${activeRequest.invoiceId}`, { credentials: "include" });
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === "paid") {
            toast({ title: "Pembayaran Berhasil!", description: "Bunga sudah ditambahkan ke akun kamu" });
            setStep("select");
            setActiveRequest(null);
            setSelectedPkg("");
            qc.invalidateQueries({ queryKey: ["/api/topup/my"] });
            qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (data.status === "expired" || data.status === "failed") {
            toast({ title: "Pembayaran Gagal", description: "Invoice kedaluwarsa. Silakan buat pembayaran baru.", variant: "destructive" });
            setStep("select");
            setActiveRequest(null);
            setSelectedPkg("");
            qc.invalidateQueries({ queryKey: ["/api/topup/my"] });
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {}
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, activeRequest]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  if (authLoading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 border-4 border-black rounded-xl bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" /></div>;
  if (!user) return null;

  const selected = packages.find((p) => p.id === selectedPkg);

  return (
    <div className="max-w-lg mx-auto px-4 py-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Link href="/profile">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black px-4 py-2 rounded-lg bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back-topup">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </Link>

      <div className="border-4 border-black rounded-xl bg-[#FFDD00] p-5 shadow-[8px_8px_0px_black] mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">🌸 Top Up Bunga</h1>
        <p className="font-semibold text-sm text-black/70">Beli bunga untuk dikirim sebagai hadiah ke penulis quote favorit kamu</p>
        <div className="flex items-center gap-2 mt-2 bg-white/70 border-2 border-black rounded-lg px-3 py-2 w-fit">
          <Flower className="w-4 h-4 text-pink-500" />
          <span className="font-black">{user.flowersBalance}</span>
          <span className="text-sm font-semibold text-gray-500">bunga saat ini</span>
        </div>
      </div>

      <div className="border-3 border-blue-300 rounded-xl bg-blue-50 p-4 mb-5 flex items-start gap-2">
        <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-blue-700">Pembayaran otomatis via QRIS — scan, bayar, bunga langsung masuk!</p>
      </div>

      {step === "select" && (
        <>
          <div className="mb-4">
            <h2 className="font-black text-sm uppercase tracking-widest mb-3">Pilih Paket</h2>
            <div className="grid grid-cols-2 gap-3">
              {packages.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`flex flex-col gap-1.5 p-4 border-3 border-black rounded-xl text-left transition-all ${selectedPkg === pkg.id ? "bg-[#FFDD00] shadow-[3px_3px_0px_black] translate-x-[3px] translate-y-[3px]" : "bg-white shadow-[6px_6px_0px_black] hover:shadow-[3px_3px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px]"}`}
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
            onClick={() => {
              if (!selectedPkg) { toast({ title: "Pilih paket dulu" }); return; }
              createRequest(selectedPkg);
            }}
            disabled={!selectedPkg || isPending}
            className="w-full py-3 bg-black text-[#FFDD00] border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_#FFDD00] hover:shadow-[2px_2px_0px_#FFDD00] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 text-sm"
            data-testid="button-topup-pay"
          >
            {isPending ? "Membuat Pembayaran..." : "Bayar dengan QRIS →"}
          </button>
        </>
      )}

      {step === "payment" && activeRequest && (
        <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[8px_8px_0px_black]">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5" /> Pembayaran QRIS
          </h2>
          <div className="bg-[#FFDD00] border-2 border-black rounded-lg p-4 mb-4">
            <p className="font-bold text-sm">🌸 {activeRequest.flowersAmount.toLocaleString("id-ID")} bunga</p>
            <p className="font-black text-xl mt-1">Rp {(activeRequest.finalAmount || activeRequest.priceIdr).toLocaleString("id-ID")}</p>
            {activeRequest.finalAmount && activeRequest.finalAmount !== activeRequest.priceIdr && (
              <p className="text-xs text-gray-600 mt-1">Harga paket Rp {activeRequest.priceIdr.toLocaleString("id-ID")} + kode unik</p>
            )}
          </div>

          {activeRequest.paymentUrl && (
            <a
              href={activeRequest.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-sm mb-4"
              data-testid="link-qris-payment"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Halaman Pembayaran QRIS
            </a>
          )}

          <div className="flex items-center gap-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg mb-4">
            <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
            <p className="text-sm font-semibold text-yellow-700">Menunggu pembayaran... Status akan update otomatis</p>
          </div>

          {activeRequest.paymentExpiry && (
            <p className="text-xs text-gray-500 text-center mb-3">
              Berlaku sampai: {new Date(activeRequest.paymentExpiry).toLocaleString("id-ID")}
            </p>
          )}

          <button
            onClick={() => { setStep("select"); setActiveRequest(null); setSelectedPkg(""); }}
            className="w-full py-2.5 border-2 border-black rounded-lg font-bold text-sm bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all"
            data-testid="button-topup-cancel"
          >
            ← Pilih Paket Lain
          </button>
        </div>
      )}

      {myRequests.length > 0 && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mt-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Riwayat Top Up</h2>
          <div className="flex flex-col gap-3">
            {myRequests.map((req) => {
              const s = STATUS_MAP[req.status] || { label: req.status, color: "bg-gray-100 text-gray-600 border-gray-300", icon: Clock };
              const Icon = s.icon;
              return (
                <div key={req.id} className="border-2 border-black rounded-lg p-4" data-testid={`row-topup-${req.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-sm">🌸 {req.flowersAmount} bunga</p>
                      <p className="text-sm font-bold text-gray-500">Rp {req.priceIdr.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
                      {req.invoiceId && <p className="text-xs text-gray-400 font-mono mt-0.5">{req.invoiceId}</p>}
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded border flex items-center gap-1 ${s.color}`}>
                      <Icon className="w-3 h-3" />
                      {s.label}
                    </span>
                  </div>
                  {req.adminNote && <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{req.adminNote}</p>}
                  {req.status === "pending" && req.paymentUrl && (
                    <a href={req.paymentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:underline"
                      data-testid={`link-pay-${req.id}`}>
                      <ExternalLink className="w-3 h-3" /> Bayar Sekarang
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
