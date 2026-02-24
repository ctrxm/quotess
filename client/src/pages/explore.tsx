import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, Tag } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteWithTags, Tag as TagType, Mood } from "@shared/schema";
import { MOODS, MOOD_LABELS, MOOD_COLORS } from "@shared/schema";

function QuoteCardSkeleton() {
  return <div className="border-4 border-black rounded-lg shadow-[6px_6px_0px_black] bg-gray-100 h-52 animate-pulse" />;
}

export default function Explore() {
  const [activeMood, setActiveMood] = useState<Mood | "">("");
  const [activeTag, setActiveTag] = useState<string>("");
  const [page, setPage] = useState(1);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (activeMood) params.set("mood", activeMood);
    if (activeTag) params.set("tag", activeTag);
    params.set("page", String(page));
    params.set("limit", "12");
    return params.toString();
  };

  const { data, isLoading } = useQuery<{ quotes: QuoteWithTags[]; total: number }>({
    queryKey: ["/api/quotes", activeMood, activeTag, page],
    queryFn: () => fetch(`/api/quotes?${buildQuery()}`).then((r) => r.json()),
  });

  const { data: allTags } = useQuery<TagType[]>({
    queryKey: ["/api/tags"],
  });

  const quotes = data?.quotes || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);

  const handleMood = (mood: Mood | "") => {
    setActiveMood(mood === activeMood ? "" : mood);
    setPage(1);
  };

  const handleTag = (slug: string) => {
    setActiveTag(slug === activeTag ? "" : slug);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#78C1FF] border-3 border-black rounded-lg shadow-[4px_4px_0px_black] flex items-center justify-center">
            <Compass className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-3xl font-black">Jelajahi Quote</h1>
        </div>
        <p className="text-gray-600 font-semibold ml-1">Filter berdasarkan mood dan tag favoritmu</p>
      </div>

      <div className="mb-6">
        <h2 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-5 h-0.5 bg-black inline-block"></span>
          Filter Mood
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleMood("")}
            className={`px-4 py-2 font-bold text-sm border-2 border-black rounded-md transition-all duration-100 ${
              activeMood === "" ? "bg-black text-white shadow-[2px_2px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
            }`}
            data-testid="button-explore-mood-all"
          >
            Semua Mood
          </button>
          {MOODS.map((mood) => {
            const colors = MOOD_COLORS[mood];
            return (
              <button
                key={mood}
                onClick={() => handleMood(mood)}
                className={`px-4 py-2 font-bold text-sm border-2 border-black rounded-md transition-all duration-100 ${
                  activeMood === mood
                    ? `${colors.bg} ${colors.text} shadow-[2px_2px_0px_black]`
                    : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                }`}
                data-testid={`button-explore-mood-${mood}`}
              >
                {MOOD_LABELS[mood]}
              </button>
            );
          })}
        </div>
      </div>

      {allTags && allTags.length > 0 && (
        <div className="mb-8">
          <h2 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Filter Tag
          </h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTag(tag.slug)}
                className={`px-3 py-1.5 font-bold text-xs border-2 border-black rounded-md transition-all duration-100 ${
                  activeTag === tag.slug
                    ? "bg-black text-white shadow-[2px_2px_0px_#FFE34D]"
                    : "bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px]"
                }`}
                data-testid={`button-tag-${tag.slug}`}
              >
                #{tag.slug}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm text-gray-600">
          {isLoading ? "Memuat..." : `${total} quote ditemukan`}
        </p>
        {(activeMood || activeTag) && (
          <button
            onClick={() => { setActiveMood(""); setActiveTag(""); setPage(1); }}
            className="text-sm font-bold border-2 border-black px-3 py-1 rounded-md bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            data-testid="button-clear-filter"
          >
            Hapus Filter
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <QuoteCardSkeleton key={i} />)}
        </div>
      ) : quotes.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <div className="text-6xl mb-4 font-black text-gray-200">"</div>
          <h3 className="text-xl font-black mb-2">Tidak ada quote</h3>
          <p className="text-gray-500 font-semibold">Coba filter yang berbeda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 font-black text-sm border-2 border-black rounded-md transition-all ${
                p === page ? "bg-black text-white shadow-[2px_2px_0px_#FFE34D]" : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
              }`}
              data-testid={`button-page-${p}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
