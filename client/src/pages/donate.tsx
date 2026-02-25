import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, ArrowLeft, ExternalLink, RefreshCw, QrCode, MessageCircle, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Donation } from "@shared/schema";

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export default function Donate() {
  const { toast } = useToast();
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: recentDonations = [] } = useQuery<Donation[]>({
    queryKey: ["/api/donate/recent"],
    queryFn: () => fetch("/api/donate/recent").then((r) => r.json()),
  });

  const { mutate: createDonation, isPending } = useMutation({
    mutationFn: (data: { donorName: string; amount: string; message: string }) =>
      apiRequest("POST", "/api/donate", data).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      setActiveDonation(data);
      setStep("payment");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (step === "payment" && activeDonation?.invoiceId) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/donate/check/${activeDonation.invoiceId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === "paid") {
            setStep("success");
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (data.status === "expired" || data.status === "failed") {
            toast({ title: "Pembayaran Gagal", description: "Invoice kedaluwarsa. Silakan coba lagi.", variant: "destructive" });
            resetForm();
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {}
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, activeDonation]);

  const handleSubmit = () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 1000) {
      toast({ title: "Minimal donasi Rp 1.000", variant: "destructive" });
      return;
    }
    createDonation({ donorName: donorName.trim() || "Anonim", amount, message: message.trim() });
  };

  const resetForm = () => {
    setStep("form");
    setActiveDonation(null);
    setDonorName("");
    setAmount("");
    setMessage("");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Link href="/">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black px-4 py-2 rounded-lg bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back-donate">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </Link>

      <div className="border-4 border-black rounded-xl bg-[#FFDEDE] p-5 shadow-[8px_8px_0px_black] mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" /> Donasi
        </h1>
        <p className="font-semibold text-sm text-black/70">
          Dukung KataViral agar terus bisa menyebarkan kutipan inspiratif untuk semua orang
        </p>
      </div>

      {step === "form" && (
        <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[8px_8px_0px_black]">
          <div className="mb-4">
            <label className="font-black text-sm block mb-1.5">
              <User className="w-4 h-4 inline mr-1" /> Nama Donatur
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Anonim"
              className="w-full px-3 py-2.5 border-3 border-black rounded-lg font-semibold text-sm shadow-[3px_3px_0px_black] focus:shadow-[1px_1px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
              data-testid="input-donor-name"
            />
          </div>

          <div className="mb-4">
            <label className="font-black text-sm block mb-1.5">Nominal Donasi (Rp)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={`px-3 py-1.5 border-2 border-black rounded-lg font-bold text-xs transition-all ${
                    amount === String(preset)
                      ? "bg-[#FFDEDE] shadow-[1px_1px_0px_black] translate-x-[2px] translate-y-[2px]"
                      : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                  }`}
                  data-testid={`button-preset-${preset}`}
                >
                  Rp {preset.toLocaleString("id-ID")}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Atau masukkan jumlah lain..."
              min="1000"
              className="w-full px-3 py-2.5 border-3 border-black rounded-lg font-semibold text-sm shadow-[3px_3px_0px_black] focus:shadow-[1px_1px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
              data-testid="input-donate-amount"
            />
          </div>

          <div className="mb-5">
            <label className="font-black text-sm block mb-1.5">
              <MessageCircle className="w-4 h-4 inline mr-1" /> Pesan (opsional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan dukunganmu..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2.5 border-3 border-black rounded-lg font-semibold text-sm shadow-[3px_3px_0px_black] focus:shadow-[1px_1px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none resize-none"
              data-testid="input-donate-message"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{message.length}/200</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || !amount}
            className="w-full py-3 bg-red-500 text-white border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 text-sm"
            data-testid="button-donate-submit"
          >
            {isPending ? "Membuat Pembayaran..." : `Donasi Rp ${parseInt(amount || "0").toLocaleString("id-ID")} →`}
          </button>
        </div>
      )}

      {step === "payment" && activeDonation && (
        <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[8px_8px_0px_black]">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5" /> Pembayaran QRIS
          </h2>
          <div className="bg-[#FFDEDE] border-2 border-black rounded-lg p-4 mb-4">
            <p className="font-bold text-sm">Donasi dari {activeDonation.donorName}</p>
            <p className="font-black text-xl mt-1">Rp {(activeDonation.finalAmount || activeDonation.amount).toLocaleString("id-ID")}</p>
            {activeDonation.finalAmount && activeDonation.finalAmount !== activeDonation.amount && (
              <p className="text-xs text-gray-600 mt-1">Rp {activeDonation.amount.toLocaleString("id-ID")} + kode unik</p>
            )}
          </div>

          {activeDonation.paymentUrl && (
            <a
              href={activeDonation.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-sm mb-4"
              data-testid="link-qris-donate"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Halaman Pembayaran QRIS
            </a>
          )}

          <div className="flex items-center gap-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg mb-4">
            <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
            <p className="text-sm font-semibold text-yellow-700">Menunggu pembayaran... Status akan update otomatis</p>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-2.5 border-2 border-black rounded-lg font-bold text-sm bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] transition-all"
            data-testid="button-donate-cancel"
          >
            ← Batal
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="border-4 border-black rounded-xl bg-green-50 p-6 shadow-[8px_8px_0px_black] text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="font-black text-xl mb-2 text-green-700">Terima Kasih!</h2>
          <p className="font-semibold text-sm text-green-600 mb-4">
            Donasimu sudah diterima. Dukunganmu sangat berarti bagi KataViral!
          </p>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 bg-green-500 text-white border-3 border-black rounded-lg font-black shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm"
            data-testid="button-donate-again"
          >
            Donasi Lagi
          </button>
        </div>
      )}

      {recentDonations.length > 0 && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mt-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> Donatur Terbaru
          </h2>
          <div className="flex flex-col gap-3">
            {recentDonations.map((d) => (
              <div key={d.id} className="border-2 border-black rounded-lg p-3 bg-[#FFDEDE]/30" data-testid={`row-donation-${d.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-sm">{d.donorName}</p>
                    <p className="font-bold text-xs text-gray-500">Rp {d.amount.toLocaleString("id-ID")}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
                {d.message && <p className="text-sm text-gray-600 mt-1.5 italic">"{d.message}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
