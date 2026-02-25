import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, Copy, Check, Gift, Flower } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  code: string;
  totalReferred: number;
  totalFlowers: number;
}

export default function Referral() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");

  const { data: stats, isLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referral"],
    enabled: !!user,
  });

  const { mutate: useCode, isPending } = useMutation({
    mutationFn: (code: string) => apiRequest("POST", "/api/referral/use", { code }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Berhasil!", description: `Kamu mendapatkan ${data.bonus} bunga bonus!` });
      qc.invalidateQueries({ queryKey: ["/api/referral"] });
      setInputCode("");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  if (authLoading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 border-4 border-black rounded-xl bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" /></div>;
  if (!user) return null;

  const shareUrl = stats ? `${window.location.origin}/auth?ref=${stats.code}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Tersalin!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#A855F7] border-3 border-black rounded-xl shadow-[4px_4px_0px_black] mb-4">
          <Users className="w-5 h-5" />
          <span className="font-black text-sm uppercase tracking-widest">Referral</span>
        </div>
        <h1 className="text-3xl font-black" data-testid="text-page-title">Ajak Teman, Dapat Bunga!</h1>
        <p className="text-black/60 font-semibold mt-1">Dapatkan 50 bunga untuk setiap teman yang bergabung</p>
      </div>

      {isLoading ? (
        <div className="border-4 border-black rounded-xl h-48 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" />
      ) : stats && (
        <>
          <div className="border-4 border-black rounded-xl bg-[#FFDD00] p-6 shadow-[8px_8px_0px_black]">
            <h3 className="font-black text-sm uppercase tracking-widest mb-3">Kode Referralmu</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-lg font-mono font-black text-xl text-center" data-testid="text-referral-code">
                {stats.code}
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-3 bg-black text-[#FFDD00] border-2 border-black rounded-lg shadow-[3px_3px_0px_#FFDD00] hover:shadow-[1px_1px_0px_#FFDD00] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                data-testid="button-copy-referral"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <input
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 border-2 border-black rounded-lg text-xs font-mono bg-white/80"
              data-testid="input-referral-link"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border-4 border-black rounded-xl bg-[#4ADE80] p-4 shadow-[4px_4px_0px_black] text-center">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="font-black text-3xl" data-testid="text-total-referred">{stats.totalReferred}</div>
              <div className="text-xs font-bold text-black/60">Teman Terdaftar</div>
            </div>
            <div className="border-4 border-black rounded-xl bg-[#FB923C] p-4 shadow-[4px_4px_0px_black] text-center">
              <Flower className="w-6 h-6 mx-auto mb-2 text-pink-500" />
              <div className="font-black text-3xl" data-testid="text-total-flowers">{stats.totalFlowers}</div>
              <div className="text-xs font-bold text-black/60">Bunga Bonus</div>
            </div>
          </div>
        </>
      )}

      <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
        <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4" /> Punya Kode Referral?
        </h3>
        <div className="flex gap-2">
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode..."
            className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-sm font-bold shadow-[2px_2px_0px_black]"
            data-testid="input-use-referral"
          />
          <button
            onClick={() => inputCode.trim() && useCode(inputCode.trim())}
            disabled={isPending || !inputCode.trim()}
            className="px-4 py-2 bg-[#A855F7] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            data-testid="button-use-referral"
          >
            {isPending ? "..." : "Pakai"}
          </button>
        </div>
      </div>
    </div>
  );
}
