import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket, ArrowLeft, Flower, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Redeem() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; flowersAmount?: number } | null>(null);

  const { mutate: redeem, isPending } = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.success) {
        setCode("");
        qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    },
    onError: () => {
      setResult({ success: false, message: "Terjadi kesalahan. Coba lagi nanti." });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  if (authLoading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 border-4 border-black dark:border-[#555] rounded-xl bg-gray-100 dark:bg-[#22222e] animate-pulse shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444]" /></div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Link href="/profile">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black dark:border-[#555] px-4 py-2 rounded-lg bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back-redeem">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </Link>

      <div className="border-4 border-black dark:border-[#555] rounded-xl bg-[#A855F7] dark:bg-[#7C3AED] p-5 shadow-[8px_8px_0px_black] dark:shadow-[8px_8px_0px_#444] mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2 text-white">
          <Ticket className="w-6 h-6" /> Redeem Kode
        </h1>
        <p className="font-semibold text-sm text-white/80">Masukkan kode untuk mendapatkan bunga gratis!</p>
        <div className="flex items-center gap-2 mt-2 bg-white/20 border-2 border-white/30 rounded-lg px-3 py-2 w-fit">
          <Flower className="w-4 h-4 text-pink-200" />
          <span className="font-black text-white">{user.flowersBalance}</span>
          <span className="text-sm font-semibold text-white/70">bunga saat ini</span>
        </div>
      </div>

      <div className="border-4 border-black dark:border-[#555] rounded-xl bg-white dark:bg-[#22222e] p-6 shadow-[8px_8px_0px_black] dark:shadow-[8px_8px_0px_#444]">
        <label className="font-black text-sm uppercase tracking-widest mb-3 block text-black dark:text-[#f5f0e0]">Masukkan Kode</label>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
          placeholder="Contoh: BONUS100"
          className="w-full px-4 py-3 border-3 border-black dark:border-[#555] rounded-xl text-center font-black text-xl tracking-widest bg-gray-50 dark:bg-[#141420] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444]"
          data-testid="input-redeem-code-page"
          maxLength={30}
        />

        <button
          onClick={() => {
            if (!code.trim()) { toast({ title: "Masukkan kode dulu" }); return; }
            redeem(code.trim());
          }}
          disabled={isPending || !code.trim()}
          className="w-full mt-4 py-3 bg-[#A855F7] text-white border-3 border-black dark:border-[#555] rounded-lg font-black shadow-[5px_5px_0px_black] dark:shadow-[5px_5px_0px_#444] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 text-sm"
          data-testid="button-redeem-submit"
        >
          {isPending ? "Memproses..." : "Redeem Kode"}
        </button>

        {result && (
          <div className={`mt-4 p-4 border-3 rounded-xl font-bold text-sm ${result.success ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`} data-testid="text-redeem-result">
            <div className="flex items-center gap-2">
              {result.success ? <Check className="w-5 h-5" /> : <span className="text-lg">❌</span>}
              <span>{result.message}</span>
            </div>
            {result.success && result.flowersAmount && (
              <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                <Sparkles className="w-4 h-4" />
                <span>+{result.flowersAmount} 🌸</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
