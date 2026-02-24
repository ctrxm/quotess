import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteWithTags, Mood } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS } from "@shared/schema";

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: quote, isLoading } = useQuery<QuoteWithTags>({
    queryKey: ["/api/quotes", id],
    queryFn: () => fetch(`/api/quotes/${id}`).then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
  });

  const { data: related } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/quotes", id, "related"],
    queryFn: () => fetch(`/api/quotes/${id}/related`).then((r) => r.json()),
    enabled: !!quote,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="border-4 border-black rounded-xl shadow-[8px_8px_0px_black] bg-[#FFF3B0] p-8 animate-pulse h-64" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="border-4 border-black rounded-xl bg-white p-12 shadow-[6px_6px_0px_black]">
          <h2 className="text-2xl font-black mb-2">Quote tidak ditemukan</h2>
          <p className="text-gray-500 font-semibold mb-4">Mungkin sudah dihapus atau ID salah</p>
          <Link href="/">
            <button className="px-6 py-2 bg-black text-white font-black border-2 border-black rounded-lg shadow-[4px_4px_0px_#FFF3B0]">
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const mood = quote.mood as Mood;
  const moodColor = MOOD_COLORS[mood];
  const shareUrl = `${window.location.origin}/q/${quote.id}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black px-4 py-2 rounded-lg bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </Link>

      <div className="mb-8">
        <QuoteCard quote={quote} variant="detail" />
      </div>

      <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mb-8">
        <h3 className="font-black text-sm uppercase tracking-widest mb-3">Bagikan Quote Ini</h3>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 border-2 border-black rounded-md text-sm font-mono bg-gray-50 min-w-0"
            data-testid="input-share-url"
          />
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 border-2 border-black rounded-md bg-[#FFF3B0] hover:bg-[#FFE68A] font-bold text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-1 whitespace-nowrap"
            data-testid="link-open-new"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {related && related.length > 0 && (
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-0.5 bg-black inline-block"></span>
            Quote Serupa — Mood {MOOD_LABELS[mood]}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((q) => (
              <QuoteCard key={q.id} quote={q} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
