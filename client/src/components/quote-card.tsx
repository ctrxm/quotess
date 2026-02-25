import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Copy, Check, Share2, Heart, Flower, Bookmark, MessageCircle, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { QuoteWithTags, Mood } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS, REACTION_TYPES } from "@shared/schema";
import GiveModal from "./give-modal";

interface QuoteCardProps {
  quote: QuoteWithTags;
  variant?: "feed" | "detail";
}

const CARD_ACCENT_COLORS = [
  { light: "bg-[#FFF3B0]", dark: "dark:bg-[#3d3a20]" },
  { light: "bg-[#C1F0C1]", dark: "dark:bg-[#1a3d1a]" },
  { light: "bg-[#B8DBFF]", dark: "dark:bg-[#203040]" },
  { light: "bg-[#FFD1A9]", dark: "dark:bg-[#3d2a1a]" },
  { light: "bg-[#DDB8FF]", dark: "dark:bg-[#2d1f3d]" },
  { light: "bg-[#FFB3B3]", dark: "dark:bg-[#4a2020]" },
];

function getCardColor(id: string): { light: string; dark: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % CARD_ACCENT_COLORS.length;
  return CARD_ACCENT_COLORS[hash];
}

export default function QuoteCard({ quote, variant = "feed" }: QuoteCardProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(quote.likedByMe || false);
  const [likeCount, setLikeCount] = useState(quote.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(quote.bookmarkedByMe || false);
  const [showGive, setShowGive] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(quote.reactions || {});
  const [myReaction, setMyReaction] = useState<string | null>(quote.myReaction || null);
  const [showReactions, setShowReactions] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
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

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: () => apiRequest("POST", `/api/quotes/${quote.id}/bookmark`, {}).then((r) => r.json()),
    onMutate: () => setBookmarked((prev) => !prev),
    onSuccess: (data) => {
      setBookmarked(data.bookmarked);
      qc.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: () => setBookmarked((prev) => !prev),
  });

  const { mutate: reactToQuote } = useMutation({
    mutationFn: (reactionType: string) =>
      apiRequest("POST", `/api/quotes/${quote.id}/react`, { reactionType }).then((r) => r.json()),
    onSuccess: (data) => {
      setReactions(data.reactions || {});
      setMyReaction(data.myReaction || null);
    },
  });

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const text = `"${quote.text}"${quote.author ? ` — ${quote.author}` : ""}\n\n#CTRXLID`;
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
      try { await navigator.share({ title: "CTRXL.ID", text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link disalin!" });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Login dulu!", description: "Silakan login untuk memberi like", variant: "destructive" }); return; }
    toggleLike();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Login dulu!", description: "Silakan login untuk bookmark", variant: "destructive" }); return; }
    toggleBookmark();
  };

  const handleGive = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Login dulu!", description: "Silakan login untuk memberi hadiah", variant: "destructive" }); return; }
    if (!user.isGiveEnabled) { toast({ title: "Fitur belum aktif", description: "Fitur Give belum diaktifkan untuk akun Anda", variant: "destructive" }); return; }
    setShowGive(true);
  };

  const handleReaction = (e: React.MouseEvent, reactionType: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Login dulu!", description: "Silakan login untuk bereaksi", variant: "destructive" }); return; }
    reactToQuote(reactionType);
  };

  const toggleReactionBar = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowReactions((prev) => !prev);
  };

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  const hasUserProfile = !quote.isAnonymous && quote.authorUser;
  const displayAuthor = hasUserProfile ? `@${quote.authorUser!.username}` : (quote.author || null);
  const authorLink = hasUserProfile
    ? `/author/@${encodeURIComponent(quote.authorUser!.username)}`
    : quote.author ? `/author/${encodeURIComponent(quote.author)}` : null;

  const cardContent = (
    <div className={`border-4 border-black dark:border-[#555] rounded-lg shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#333] ${cardColor.light} ${cardColor.dark} transition-all duration-100 hover:shadow-[3px_3px_0px_black] dark:hover:shadow-[3px_3px_0px_#333] hover:translate-x-[3px] hover:translate-y-[3px] flex flex-col h-full`} data-testid={`card-quote-${quote.id}`}>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border-2 border-black dark:border-[#555] ${moodColor.bg} ${moodColor.text}`}>
            {MOOD_LABELS[mood]}
          </span>
          <button onClick={handleBookmark} className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${bookmarked ? "bg-yellow-200 dark:bg-yellow-800/40 text-yellow-700 dark:text-yellow-400" : "bg-white/60 dark:bg-white/10 text-black/40 dark:text-[#f5f0e0]/40 hover:text-black dark:hover:text-[#f5f0e0]"}`} data-testid={`button-bookmark-${quote.id}`}>
            <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-yellow-600 dark:fill-yellow-400" : ""}`} />
          </button>
        </div>
        <blockquote className={`font-bold leading-snug text-black dark:text-[#f5f0e0] flex-1 ${variant === "detail" ? "text-2xl md:text-3xl" : "text-base md:text-lg"}`}>
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {displayAuthor && (
          <p className="text-sm font-semibold text-black/70 dark:text-[#f5f0e0]/70">
            —{" "}
            <span
              className="hover:underline cursor-pointer hover:text-black dark:hover:text-[#f5f0e0] inline-flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (authorLink) navigate(authorLink);
              }}
              data-testid={`link-author-${quote.id}`}
            >
              {displayAuthor}
              {quote.authorUser?.isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 inline-block flex-shrink-0" data-testid={`verified-badge-${quote.id}`} />
              )}
            </span>
          </p>
        )}
        {quote.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {quote.tags.map((tag) => (
              <span key={tag.id} className="px-2 py-0.5 bg-black dark:bg-[#555] text-white dark:text-[#f5f0e0] text-xs font-bold rounded border border-black dark:border-[#444]">#{tag.slug}</span>
            ))}
          </div>
        )}
      </div>

      {showReactions && (
        <div className="border-t-2 border-black/20 dark:border-[#555] px-3 py-2 flex items-center justify-center gap-2">
          {REACTION_TYPES.map((r) => {
            const count = reactions[r.type] || 0;
            const isActive = myReaction === r.type;
            return (
              <button
                key={r.type}
                onClick={(e) => handleReaction(e, r.type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border-2 font-bold text-xs transition-all ${isActive ? "border-black dark:border-[#f5f0e0] bg-white dark:bg-[#3a3a38] scale-110 shadow-[2px_2px_0px_black] dark:shadow-[2px_2px_0px_#333]" : "border-transparent hover:border-black/30 dark:hover:border-[#555] hover:bg-white/60 dark:hover:bg-white/10"}`}
                data-testid={`button-react-${r.type}-${quote.id}`}
              >
                <span className="text-base">{r.emoji}</span>
                {count > 0 && <span className="text-black/70 dark:text-[#f5f0e0]/70">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="border-t-3 border-black dark:border-[#555] grid grid-cols-6">
        <button onClick={handleLike} className={`flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm border-r-2 border-black dark:border-[#555] transition-colors ${liked ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-black dark:text-[#f5f0e0]"}`} data-testid={`button-like-${quote.id}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          <span className="text-xs">{likeCount}</span>
        </button>
        <button onClick={toggleReactionBar} className={`flex items-center justify-center gap-1 py-2.5 font-bold text-sm border-r-2 border-black dark:border-[#555] transition-colors ${showReactions || totalReactions > 0 ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" : "bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-black dark:text-[#f5f0e0]"}`} data-testid={`button-reactions-${quote.id}`}>
          <span className="text-sm">🔥</span>
          {totalReactions > 0 && <span className="text-xs">{totalReactions}</span>}
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/q/${quote.id}`); }} className="flex items-center justify-center gap-1 py-2.5 font-bold text-sm border-r-2 border-black dark:border-[#555] bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors text-black dark:text-[#f5f0e0]" data-testid={`button-comments-${quote.id}`}>
          <MessageCircle className="w-4 h-4" />
          {(quote.commentsCount || 0) > 0 && <span className="text-xs">{quote.commentsCount}</span>}
        </button>
        <button onClick={handleGive} className="flex items-center justify-center gap-1 py-2.5 font-bold text-sm border-r-2 border-black dark:border-[#555] bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors" data-testid={`button-give-${quote.id}`}>
          <Flower className="w-4 h-4 text-pink-500" />
        </button>
        <button onClick={handleCopy} className="flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm border-r-2 border-black dark:border-[#555] bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors text-black dark:text-[#f5f0e0]" data-testid={`button-copy-${quote.id}`}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={handleShare} className="flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors text-black dark:text-[#f5f0e0]" data-testid={`button-share-${quote.id}`}>
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
