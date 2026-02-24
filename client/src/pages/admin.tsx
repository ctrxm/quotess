import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Check, X, Clock } from "lucide-react";
import type { QuoteWithTags } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS } from "@shared/schema";
import type { Mood } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [key, setKey] = useState("");
  const [enteredKey, setEnteredKey] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: pending, isLoading, refetch } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/admin/quotes", enteredKey],
    queryFn: () => fetch(`/api/admin/quotes?key=${encodeURIComponent(enteredKey)}`).then(async (r) => {
      if (r.status === 403) throw new Error("forbidden");
      return r.json();
    }),
    enabled: isAuth,
    retry: false,
  });

  const { mutate: updateStatus, isPending: updating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/quotes/${id}?key=${encodeURIComponent(enteredKey)}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/quotes", enteredKey] });
      qc.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Status diperbarui!" });
    },
    onError: () => toast({ title: "Gagal", variant: "destructive" }),
  });

  const handleLogin = () => {
    setEnteredKey(key);
    setIsAuth(true);
  };

  if (!isAuth) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <div className="border-4 border-black rounded-xl bg-white p-8 shadow-[8px_8px_0px_black]">
          <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#FFE34D]">
            <Shield className="w-7 h-7 text-[#FFE34D]" />
          </div>
          <h1 className="text-2xl font-black mb-1">Admin Panel</h1>
          <p className="text-gray-500 font-semibold text-sm mb-6">Masukkan admin secret untuk akses</p>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Admin Secret..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-2.5 border-2 border-black rounded-lg font-semibold shadow-[3px_3px_0px_black] focus:outline-none text-sm"
              data-testid="input-admin-key"
            />
            <button
              onClick={handleLogin}
              className="px-6 py-2.5 bg-black text-[#FFE34D] font-black border-2 border-black rounded-lg shadow-[4px_4px_0px_#FFE34D] hover:shadow-[2px_2px_0px_#FFE34D] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm"
              data-testid="button-admin-login"
            >
              Masuk
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 font-medium">
            Jika ADMIN_SECRET belum dikonfigurasi, biarkan kosong dan tekan Masuk.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-4 border-black rounded-xl h-28 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-[4px_4px_0px_#FFE34D]">
              <Shield className="w-5 h-5 text-[#FFE34D]" />
            </div>
            <h1 className="text-3xl font-black">Admin Panel</h1>
          </div>
          <p className="text-gray-600 font-semibold text-sm">
            {pending?.length || 0} quote menunggu moderasi
          </p>
        </div>
        <button
          onClick={() => { setIsAuth(false); setKey(""); setEnteredKey(""); }}
          className="px-4 py-2 border-2 border-black rounded-lg font-bold text-sm bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          data-testid="button-admin-logout"
        >
          Keluar
        </button>
      </div>

      {!pending || pending.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <div className="w-16 h-16 bg-[#A8FF78] border-3 border-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_black]">
            <Check className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-black mb-2">Semua bersih!</h3>
          <p className="text-gray-500 font-semibold">Tidak ada quote yang menunggu moderasi</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((quote) => {
            const mood = quote.mood as Mood;
            const moodColor = MOOD_COLORS[mood];
            return (
              <div key={quote.id} className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]" data-testid={`card-pending-${quote.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-bold border-2 border-black rounded ${moodColor.bg} ${moodColor.text}`}>
                      {MOOD_LABELS[mood]}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-300 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{quote.id.slice(0, 8)}...</span>
                </div>

                <blockquote className="font-bold text-black text-base mb-2 leading-snug">
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
                {quote.author && <p className="text-sm text-gray-600 font-semibold mb-3">— {quote.author}</p>}

                {quote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {quote.tags.map((tag) => (
                      <span key={tag.id} className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-bold rounded">#{tag.slug}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t-2 border-dashed border-gray-200">
                  <button
                    onClick={() => updateStatus({ id: quote.id, status: "approved" })}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#A8FF78] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60"
                    data-testid={`button-approve-${quote.id}`}
                  >
                    <Check className="w-4 h-4" />
                    Setujui
                  </button>
                  <button
                    onClick={() => updateStatus({ id: quote.id, status: "rejected" })}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#FF7878] border-2 border-black rounded-lg font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60"
                    data-testid={`button-reject-${quote.id}`}
                  >
                    <X className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
