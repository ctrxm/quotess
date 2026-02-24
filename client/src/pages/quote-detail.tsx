import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Send, Trash2, MessageCircle } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { QuoteWithTags, QuoteCommentWithUser, Mood } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS } from "@shared/schema";

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: quote, isLoading } = useQuery<QuoteWithTags>({
    queryKey: ["/api/quotes", id],
    queryFn: () => fetch(`/api/quotes/${id}`).then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
  });

  const { data: related } = useQuery<QuoteWithTags[]>({
    queryKey: ["/api/quotes", id, "related"],
    queryFn: () => fetch(`/api/quotes/${id}/related`).then((r) => r.json()),
    enabled: !!quote,
  });

  const { data: comments = [] } = useQuery<QuoteCommentWithUser[]>({
    queryKey: ["/api/quotes", id, "comments"],
    queryFn: () => fetch(`/api/quotes/${id}/comments`).then((r) => r.json()),
    enabled: !!quote,
  });

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: (text: string) => apiRequest("POST", `/api/quotes/${id}/comments`, { text }).then((r) => r.json()),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["/api/quotes", id, "comments"] });
      qc.invalidateQueries({ queryKey: ["/api/quotes", id] });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const { mutate: deleteComment } = useMutation({
    mutationFn: (commentId: string) => apiRequest("DELETE", `/api/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/quotes", id, "comments"] });
      qc.invalidateQueries({ queryKey: ["/api/quotes", id] });
    },
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
        <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Komentar ({comments.length})
        </h3>

        {user && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Tulis komentar..."
              maxLength={500}
              className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold focus:outline-none focus:ring-0 shadow-[2px_2px_0px_black]"
              onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) addComment(commentText.trim()); }}
              data-testid="input-comment"
            />
            <button
              onClick={() => commentText.trim() && addComment(commentText.trim())}
              disabled={isAddingComment || !commentText.trim()}
              className="px-3 py-2 bg-[#C1F0C1] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
              data-testid="button-send-comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
        {!user && (
          <p className="text-sm text-gray-500 font-semibold mb-4">
            <Link href="/auth"><span className="underline font-bold cursor-pointer">Login</span></Link> untuk menambahkan komentar
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 font-semibold text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" data-testid={`comment-${c.id}`}>
                <div className="w-8 h-8 bg-[#DDB8FF] border-2 border-black rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black">{c.username[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm" data-testid={`text-comment-user-${c.id}`}>@{c.username}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-black/80 mt-0.5" data-testid={`text-comment-${c.id}`}>{c.text}</p>
                </div>
                {user && user.id === c.userId && (
                  <button onClick={() => deleteComment(c.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" data-testid={`button-delete-comment-${c.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
