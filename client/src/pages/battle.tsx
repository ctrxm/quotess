import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Swords, Timer, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { QuoteBattleWithQuotes, Mood } from "@shared/schema";
import { MOOD_LABELS, MOOD_COLORS } from "@shared/schema";

const CARD_ACCENT_COLORS = ["bg-[#FFDD00]", "bg-[#4ADE80]", "bg-[#60A5FA]", "bg-[#FB923C]", "bg-[#A855F7]", "bg-[#F87171]"];
function getCardColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % CARD_ACCENT_COLORS.length;
  return CARD_ACCENT_COLORS[hash];
}

export default function Battle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: battle, isLoading } = useQuery<QuoteBattleWithQuotes | null>({
    queryKey: ["/api/battles/active"],
  });

  const { mutate: vote, isPending } = useMutation({
    mutationFn: (votedQuoteId: string) =>
      apiRequest("POST", `/api/battles/${battle?.id}/vote`, { votedQuoteId }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/battles/active"] });
      toast({ title: "Vote berhasil!" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const handleVote = (quoteId: string) => {
    if (!user) { toast({ title: "Login dulu!", variant: "destructive" }); return; }
    vote(quoteId);
  };

  const totalVotes = (battle?.votesA || 0) + (battle?.votesB || 0);
  const pctA = totalVotes > 0 ? Math.round((battle!.votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const timeLeft = battle?.endsAt ? Math.max(0, new Date(battle.endsAt).getTime() - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="border-4 border-black rounded-xl h-96 bg-gray-100 animate-pulse shadow-[8px_8px_0px_black]" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="border-4 border-black rounded-xl bg-white p-12 shadow-[6px_6px_0px_black]">
          <Swords className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <h2 className="text-2xl font-black mb-2">Belum ada battle</h2>
          <p className="text-gray-500 font-semibold">Battle baru akan segera dimulai!</p>
        </div>
      </div>
    );
  }

  const hasVoted = !!battle.myVote;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F87171] border-3 border-black rounded-xl shadow-[4px_4px_0px_black] mb-4">
          <Swords className="w-5 h-5" />
          <span className="font-black text-sm uppercase tracking-widest">Quote Battle</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black" data-testid="text-battle-title">Pilih Quote Favoritmu!</h1>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm font-bold text-black/60">
          <Timer className="w-4 h-4" />
          <span>Berakhir dalam {hoursLeft}j {minsLeft}m</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { quote: battle.quoteA, side: "A" as const, votes: battle.votesA, pct: pctA },
          { quote: battle.quoteB, side: "B" as const, votes: battle.votesB, pct: pctB },
        ].map(({ quote, side, votes, pct }) => {
          const mood = quote.mood as Mood;
          const moodColor = MOOD_COLORS[mood];
          const isMyVote = battle.myVote === quote.id;
          const cardColor = getCardColor(quote.id);

          return (
            <div key={quote.id} className="flex flex-col gap-3">
              <div className={`border-4 border-black rounded-xl ${cardColor} shadow-[6px_6px_0px_black] p-5 flex flex-col gap-3 ${isMyVote ? "ring-4 ring-yellow-400" : ""}`} data-testid={`card-battle-${side}`}>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border-2 border-black self-start ${moodColor.bg} ${moodColor.text}`}>
                  {MOOD_LABELS[mood]}
                </span>
                <blockquote className="text-lg md:text-xl font-bold leading-snug">
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
                {quote.author && <p className="text-sm font-semibold text-black/70">— {quote.author}</p>}
              </div>

              {hasVoted ? (
                <div className="border-3 border-black rounded-lg overflow-hidden bg-white">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="font-black text-sm">{votes} vote</span>
                    <span className="font-black text-sm">{pct}%</span>
                  </div>
                  <div className="h-3 bg-gray-200">
                    <div className={`h-full ${side === "A" ? "bg-[#F87171]" : "bg-[#60A5FA]"} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  {isMyVote && (
                    <div className="text-center py-1 text-xs font-black text-yellow-700 bg-yellow-100">
                      <Trophy className="w-3 h-3 inline mr-1" /> Pilihanmu
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleVote(quote.id)}
                  disabled={isPending}
                  className={`py-3 font-black text-sm border-3 border-black rounded-lg shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${side === "A" ? "bg-[#F87171]" : "bg-[#60A5FA]"} disabled:opacity-50`}
                  data-testid={`button-vote-${side}`}
                >
                  Pilih Quote Ini
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-black/50">Total {totalVotes} vote</p>
      </div>
    </div>
  );
}
