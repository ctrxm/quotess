import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Eye, Heart, Flame } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteWithTags } from "@shared/schema";

function QuoteCardSkeleton() {
  return (
    <div className="border-4 border-black rounded-lg shadow-[6px_6px_0px_black] bg-gray-100 h-52 animate-pulse" />
  );
}

export default function Trending() {
  const { data: quotes, isLoading } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/quotes/trending"],
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="border-4 border-black bg-[#FFD1A9] rounded-xl p-6 md:p-10 shadow-[8px_8px_0px_black] relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-20">
            <Flame className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-widest">Trending</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-black mb-3" data-testid="text-page-title">
            Quote Trending
          </h1>
          <p className="text-black/70 font-semibold max-w-lg">
            Quote paling populer berdasarkan jumlah views dan likes dari seluruh pengguna KataViral.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <QuoteCardSkeleton key={i} />)}
        </div>
      ) : !quotes || quotes.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <div className="text-6xl mb-4 font-black text-gray-200">"</div>
          <h3 className="text-xl font-black mb-2">Belum ada quote trending</h3>
          <p className="text-gray-500 font-semibold">Quote akan muncul di sini setelah mendapat views dan likes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            <div key={quote.id} className="flex gap-4 items-start" data-testid={`trending-item-${index}`}>
              <div className={`flex-shrink-0 w-12 h-12 border-3 border-black rounded-lg flex items-center justify-center font-black text-lg shadow-[3px_3px_0px_black] ${index < 3 ? "bg-[#FFF3B0]" : "bg-white"}`}>
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <QuoteCard quote={quote} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
