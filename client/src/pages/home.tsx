import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, ChevronLeft, ChevronRight, Zap, TrendingUp, Sparkles, Sun, Palette } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import AdCard from "@/components/ad-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteWithTags, Mood, Ad } from "@shared/schema";
import { MOODS, MOOD_LABELS, MOOD_COLORS } from "@shared/schema";

function QuoteCardSkeleton() {
  return (
    <div className="border-4 border-black dark:border-[#555] rounded-lg shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444] bg-gray-100 dark:bg-[#22222e] h-52 animate-pulse" />
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

  const { data: dailyQuote } = useQuery<QuoteWithTags>({
    queryKey: ["/api/quotes/daily"],
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
        <div className="border-4 border-black dark:border-[#555] bg-[#FFDD00] dark:bg-[#B8960F] rounded-xl p-6 md:p-10 shadow-[8px_8px_0px_black] dark:shadow-[8px_8px_0px_#444] relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-20 text-8xl font-black select-none text-black dark:text-[#f5f0e0]">"</div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 fill-black dark:fill-[#f5f0e0] text-black dark:text-[#f5f0e0]" />
            <span className="text-sm font-black uppercase tracking-widest text-black dark:text-[#f5f0e0]">CTRXL.ID</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-black dark:text-[#f5f0e0] mb-3">
            Quote Indonesia<br />
            <span className="text-black/60 dark:text-[#f5f0e0]/60">yang Bikin Viral</span>
          </h1>
          <p className="text-black/70 dark:text-[#f5f0e0]/70 font-semibold mb-6 max-w-lg">
            Temukan, bagikan, dan submit kata-kata bijak, galau, semangat, & lebih dari ribuan quote berbahasa Indonesia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore">
              <button className="px-6 py-3 bg-black dark:bg-[#f5f0e0] text-[#FFDD00] dark:text-[#141420] font-black border-3 border-black dark:border-[#555] rounded-lg shadow-[4px_4px_0px_#444] hover:shadow-[2px_2px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm" data-testid="button-explore-hero">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Jelajahi Semua
              </button>
            </Link>
            <Link href="/submit">
              <button className="px-6 py-3 bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] font-black border-3 border-black dark:border-[#555] rounded-lg shadow-[4px_4px_0px_black] dark:shadow-[4px_4px_0px_#444] hover:shadow-[2px_2px_0px_black] dark:hover:shadow-[2px_2px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm" data-testid="button-submit-hero">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Submit Quote
              </button>
            </Link>
          </div>
        </div>
      </section>

      {dailyQuote && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 fill-yellow-400 text-yellow-500" />
            <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-[#f5f0e0]">Quote Hari Ini</h2>
          </div>
          <div className="max-w-2xl">
            <QuoteCard quote={dailyQuote} />
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/trending">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FB923C] dark:bg-[#C2410C] font-black text-sm border-3 border-black dark:border-[#555] rounded-lg shadow-[4px_4px_0px_black] dark:shadow-[4px_4px_0px_#444] hover:shadow-[2px_2px_0px_black] dark:hover:shadow-[2px_2px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer text-black dark:text-[#f5f0e0]" data-testid="link-trending">
            <TrendingUp className="w-4 h-4" /> Trending
          </span>
        </Link>
        <Link href="/maker">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A855F7] dark:bg-[#7C3AED] font-black text-sm border-3 border-black dark:border-[#555] rounded-lg shadow-[4px_4px_0px_black] dark:shadow-[4px_4px_0px_#444] hover:shadow-[2px_2px_0px_black] dark:hover:shadow-[2px_2px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer text-black dark:text-[#f5f0e0]" data-testid="link-maker">
            <Palette className="w-4 h-4" /> Quote Maker
          </span>
        </Link>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/50 dark:text-[#f5f0e0]/50" />
        <input
          type="search"
          placeholder="Cari quote atau penulis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-3 border-black dark:border-[#555] rounded-lg font-semibold bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[4px_4px_0px_black] dark:shadow-[4px_4px_0px_#444] focus:outline-none focus:shadow-[2px_2px_0px_black] dark:focus:shadow-[2px_2px_0px_#444] focus:translate-x-[2px] focus:translate-y-[2px] transition-all text-sm placeholder:text-black/40 dark:placeholder:text-[#f5f0e0]/40"
          data-testid="input-search"
        />
      </div>

      {!debouncedSearch && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveMood("")}
            className={`px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md transition-all duration-100 ${
              activeMood === "" ? "bg-black dark:bg-[#f5f0e0] text-white dark:text-[#141420] shadow-[2px_2px_0px_#FFDD00] dark:shadow-[2px_2px_0px_#555]" : "bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] dark:hover:shadow-[1px_1px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px]"
            }`}
            data-testid="button-mood-all"
          >
            Semua
          </button>
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setActiveMood(mood === activeMood ? "" : mood)}
              className={`px-4 py-2 font-bold text-sm border-2 border-black dark:border-[#555] rounded-md transition-all duration-100 ${
                activeMood === mood ? "bg-black dark:bg-[#f5f0e0] text-white dark:text-[#141420] shadow-[2px_2px_0px_#FFDD00] dark:shadow-[2px_2px_0px_#555]" : "bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] dark:hover:shadow-[1px_1px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px]"
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
        <div className="border-4 border-black dark:border-[#555] rounded-xl bg-white dark:bg-[#22222e] p-12 text-center shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#444]">
          <div className="text-6xl mb-4 font-black text-gray-200 dark:text-gray-600">"</div>
          <h3 className="text-xl font-black mb-2 text-black dark:text-[#f5f0e0]">Tidak ada quote ditemukan</h3>
          <p className="text-gray-500 dark:text-gray-400 font-semibold">Coba cari dengan kata kunci lain atau ganti filter mood</p>
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
            className="w-10 h-10 border-2 border-black dark:border-[#555] rounded-md bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] dark:hover:shadow-[1px_1px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black text-sm border-2 border-black dark:border-[#555] px-4 py-2 bg-[#FFDD00] dark:bg-[#B8960F] text-black dark:text-[#f5f0e0] rounded-md shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 border-2 border-black dark:border-[#555] rounded-md bg-white dark:bg-[#22222e] text-black dark:text-[#f5f0e0] shadow-[3px_3px_0px_black] dark:shadow-[3px_3px_0px_#444] hover:shadow-[1px_1px_0px_black] dark:hover:shadow-[1px_1px_0px_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold"
            data-testid="button-next-page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
