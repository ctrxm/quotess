import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, ChevronLeft, ChevronRight, Zap, TrendingUp, Sparkles } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import AdCard from "@/components/ad-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteWithTags, Mood, Ad } from "@shared/schema";
import { MOODS, MOOD_LABELS } from "@shared/schema";

function QuoteCardSkeleton() {
  return (
    <div className="border-4 border-black rounded-lg shadow-[6px_6px_0px_black] bg-gray-100 h-52 animate-pulse" />
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeMood, setActiveMood] = useState<Mood | "">("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [activeMood, debouncedSearch]);

  const { data, isLoading } = useQuery<{ quotes: QuoteWithTags[]; total: number }>({
    queryKey: ["/api/quotes", activeMood, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeMood) params.set("mood", activeMood);
      params.set("page", String(page));
      params.set("limit", "12");
      return fetch(`/api/quotes?${params}`).then((r) => r.json());
    },
    enabled: !debouncedSearch,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/quotes/search", debouncedSearch],
    queryFn: () => fetch(`/api/quotes/search?q=${encodeURIComponent(debouncedSearch)}`).then((r) => r.json()),
    enabled: !!debouncedSearch,
  });

  const { data: adsData } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
  });
  const inlineAds = (Array.isArray(adsData) ? adsData : []).filter((a) => a.position === "inline");
  const bottomAds = (Array.isArray(adsData) ? adsData : []).filter((a) => a.position === "bottom");

  const quotes = debouncedSearch ? (searchResults || []) : (data?.quotes || []);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);
  const loading = debouncedSearch ? searchLoading : isLoading;

  function buildGrid(quoteList: QuoteWithTags[]) {
    const AD_EVERY = 4;
    const items: { type: "quote" | "ad"; data: QuoteWithTags | Ad; key: string }[] = [];
    let adIdx = 0;
    quoteList.forEach((q, i) => {
      items.push({ type: "quote", data: q, key: q.id });
      if ((i + 1) % AD_EVERY === 0 && adIdx < inlineAds.length) {
        items.push({ type: "ad", data: inlineAds[adIdx], key: `ad-${inlineAds[adIdx].id}` });
        adIdx++;
      }
    });
    return items;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-10">
        <div className="border-4 border-black bg-[#FFE34D] rounded-xl p-6 md:p-10 shadow-[8px_8px_0px_black] relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-20 text-8xl font-black select-none">"</div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 fill-black" />
            <span className="text-sm font-black uppercase tracking-widest">KataViral</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-black mb-3">
            Quote Indonesia<br />
            <span className="text-black/60">yang Bikin Viral</span>
          </h1>
          <p className="text-black/70 font-semibold mb-6 max-w-lg">
            Temukan, bagikan, dan submit kata-kata bijak, galau, semangat, & lebih dari ribuan quote berbahasa Indonesia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore">
              <button className="px-6 py-3 bg-black text-[#FFE34D] font-black border-3 border-black rounded-lg shadow-[4px_4px_0px_#333] hover:shadow-[2px_2px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm" data-testid="button-explore-hero">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Jelajahi Semua
              </button>
            </Link>
            <Link href="/submit">
              <button className="px-6 py-3 bg-white text-black font-black border-3 border-black rounded-lg shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm" data-testid="button-submit-hero">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Submit Quote
              </button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/50" />
        <input
          type="search"
          placeholder="Cari quote atau penulis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-3 border-black rounded-lg font-semibold bg-white shadow-[4px_4px_0px_black] focus:outline-none focus:shadow-[2px_2px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all text-sm"
          data-testid="input-search"
        />
      </div>

      {!debouncedSearch && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveMood("")}
            className={`px-4 py-2 font-bold text-sm border-2 border-black rounded-md transition-all duration-100 ${
              activeMood === "" ? "bg-black text-white shadow-[2px_2px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
            }`}
            data-testid="button-mood-all"
          >
            Semua
          </button>
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setActiveMood(mood === activeMood ? "" : mood)}
              className={`px-4 py-2 font-bold text-sm border-2 border-black rounded-md transition-all duration-100 ${
                activeMood === mood ? "bg-black text-white shadow-[2px_2px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
              }`}
              data-testid={`button-mood-${mood}`}
            >
              {MOOD_LABELS[mood]}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <QuoteCardSkeleton key={i} />)}
        </div>
      ) : quotes.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <div className="text-6xl mb-4 font-black text-gray-200">"</div>
          <h3 className="text-xl font-black mb-2">Tidak ada quote ditemukan</h3>
          <p className="text-gray-500 font-semibold">Coba cari dengan kata kunci lain atau ganti filter mood</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {buildGrid(quotes).map((item) =>
            item.type === "quote"
              ? <QuoteCard key={item.key} quote={item.data as QuoteWithTags} />
              : <AdCard key={item.key} ad={item.data as Ad} />
          )}
        </div>
      )}

      {bottomAds.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {bottomAds.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}

      {!debouncedSearch && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 border-2 border-black rounded-md bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black text-sm border-2 border-black px-4 py-2 bg-[#FFE34D] rounded-md shadow-[3px_3px_0px_black]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 border-2 border-black rounded-md bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold"
            data-testid="button-next-page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
