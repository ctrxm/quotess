import { useState } from "react";
import { Link } from "wouter";
import { Copy, Check, Share2, Heart, Flower } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { QuoteWithTags, Mood } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS } from "@shared/schema";
import GiveModal from "./give-modal";

interface QuoteCardProps {
  quote: QuoteWithTags;
  variant?: "feed" | "detail";
}

const CARD_ACCENT_COLORS = [
  "bg-[#FFF3B0]", "bg-[#C1F0C1]", "bg-[#B8DBFF]",
  "bg-[#FFD1A9]", "bg-[#DDB8FF]", "bg-[#FFB3B3]",
];

function getCardColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % CARD_ACCENT_COLORS.length;
  return CARD_ACCENT_COLORS[hash];
}

export default function QuoteCard({ quote, variant = "feed" }: QuoteCardProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(quote.likedByMe || false);
  const [likeCount, setLikeCount] = useState(quote.likesCount || 0);
  const [showGive, setShowGive] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const cardColor = getCardColor(quote.id);
  const mood = quote.mood as Mood;
  const moodColor = MOOD_COLORS[mood];

  const { mutate: toggleLike } = useMutation({
    mutationFn: () => apiRequest("POST", `/api/quotes/${quote.id}/like`, {}).then((r) => r.json()),
    onMutate: () => {
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev - 1 : prev + 1);
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      setLikeCount(data.count);
    },
    onError: () => {
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev + 1 : prev - 1);
    },
  });

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const text = `"${quote.text}"${quote.author ? ` — ${quote.author}` : ""}\n\n#KataViral`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Tersalin!", description: "Quote berhasil disalin ke clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/q/${quote.id}`;
    const text = `"${quote.text}"${quote.author ? ` — ${quote.author}` : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: "KataViral", text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link disalin!" });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Login dulu!", description: "Silakan login untuk memberi like", variant: "destructive" }); return; }
    toggleLike();
  };

  const handleGive = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Login dulu!", description: "Silakan login untuk memberi hadiah", variant: "destructive" }); return; }
    if (!user.isGiveEnabled) { toast({ title: "Fitur belum aktif", description: "Fitur Give belum diaktifkan untuk akun Anda", variant: "destructive" }); return; }
    setShowGive(true);
  };

  const cardContent = (
    <div className={`border-4 border-black rounded-lg shadow-[6px_6px_0px_black] ${cardColor} transition-all duration-100 hover:shadow-[3px_3px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] flex flex-col h-full`} data-testid={`card-quote-${quote.id}`}>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border-2 border-black ${moodColor.bg} ${moodColor.text}`}>
            {MOOD_LABELS[mood]}
          </span>
        </div>
        <blockquote className={`font-bold leading-snug text-black flex-1 ${variant === "detail" ? "text-2xl md:text-3xl" : "text-base md:text-lg"}`}>
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {quote.author && <p className="text-sm font-semibold text-black/70">— {quote.author}</p>}
        {!quote.isAnonymous && quote.authorUser && !quote.author && (
          <p className="text-sm font-semibold text-black/70">— @{quote.authorUser.username}</p>
        )}
        {quote.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {quote.tags.map((tag) => (
              <span key={tag.id} className="px-2 py-0.5 bg-black text-white text-xs font-bold rounded border border-black">#{tag.slug}</span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t-3 border-black grid grid-cols-4">
        <button onClick={handleLike} className={`flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm border-r-2 border-black transition-colors ${liked ? "bg-red-100 text-red-600" : "bg-white/50 hover:bg-white"}`} data-testid={`button-like-${quote.id}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          <span className="text-xs">{likeCount}</span>
        </button>
        <button onClick={handleGive} className="flex items-center justify-center gap-1 py-2.5 font-bold text-sm border-r-2 border-black bg-white/50 hover:bg-white transition-colors" data-testid={`button-give-${quote.id}`}>
          <Flower className="w-4 h-4 text-pink-500" />
        </button>
        <button onClick={handleCopy} className="flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm border-r-2 border-black bg-white/50 hover:bg-white transition-colors" data-testid={`button-copy-${quote.id}`}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={handleShare} className="flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm bg-white/50 hover:bg-white transition-colors" data-testid={`button-share-${quote.id}`}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showGive && (
        <GiveModal
          quoteId={quote.id}
          receiverId={quote.authorUser?.id}
          receiverName={quote.authorUser?.username}
          onClose={() => setShowGive(false)}
        />
      )}
      {variant === "feed" ? (
        <Link href={`/q/${quote.id}`}><div className="cursor-pointer h-full">{cardContent}</div></Link>
      ) : cardContent}
    </>
  );
}
