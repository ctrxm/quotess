import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Flower, ArrowRight, Clock, TrendingUp, Heart, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { FlowerTransaction } from "@shared/schema";
import { Link } from "wouter";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: history = [] } = useQuery<FlowerTransaction[]>({
    queryKey: ["/api/flowers/history"],
    queryFn: () => fetch("/api/flowers/history", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user?.isGiveEnabled,
  });

  if (authLoading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="border-4 border-black rounded-xl h-48 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" /></div>;

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="border-4 border-black rounded-xl bg-[#FFE34D] p-6 shadow-[8px_8px_0px_black] mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-black border-3 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-[#FFE34D]" />
          </div>
          <div>
            <h1 className="text-2xl font-black">@{user.username}</h1>
            <p className="text-black/60 font-semibold text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-black text-[#FFE34D] text-xs font-black rounded border-2 border-black">
                {user.role === "admin" ? "Admin" : "Member"}
              </span>
              {user.hasBetaAccess && <span className="px-2 py-1 bg-[#78C1FF] text-black text-xs font-black rounded border-2 border-black">Beta</span>}
              {user.isGiveEnabled && <span className="px-2 py-1 bg-[#A8FF78] text-black text-xs font-black rounded border-2 border-black">Give Aktif</span>}
            </div>
          </div>
        </div>
      </div>

      {user.isGiveEnabled && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mb-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <Flower className="w-4 h-4 text-pink-500" />
            Saldo Bunga
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-black">{user.flowersBalance}</span>
                <span className="text-lg font-bold text-gray-500">bunga</span>
              </div>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                = Rp {(user.flowersBalance * 10).toLocaleString("id-ID")}
              </p>
            </div>
            <Link href="/withdraw">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#FFE34D] border-2 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-go-withdraw">
                Tukar <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      )}

      {user.isGiveEnabled && history.length > 0 && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Riwayat Bunga
          </h2>
          <div className="flex flex-col gap-3">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  {tx.type === "credit" ? (
                    <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded-lg flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 border-2 border-red-400 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-black">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
                <span className={`font-black text-sm ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "credit" ? "+" : "-"}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!user.isGiveEnabled && (
        <div className="border-4 border-black rounded-xl bg-[#78C1FF] p-5 shadow-[6px_6px_0px_black]">
          <h3 className="font-black mb-2 flex items-center gap-2"><Flower className="w-5 h-5" /> Fitur Give</h3>
          <p className="font-semibold text-sm text-black/70">
            Fitur Give belum diaktifkan untuk akun kamu. Hubungi admin untuk mengaktifkan fitur ini.
          </p>
        </div>
      )}
    </div>
  );
}
