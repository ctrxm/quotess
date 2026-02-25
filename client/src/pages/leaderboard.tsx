import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, Heart, Eye, BookOpen, Crown, Medal } from "lucide-react";

interface AuthorRank {
  author: string;
  totalQuotes: number;
  totalLikes: number;
  totalViews: number;
  score: number;
}

const RANK_COLORS = ["bg-[#FFDD00]", "bg-[#4ADE80]", "bg-[#60A5FA]"];
const RANK_ICONS = [
  <Crown className="w-6 h-6 text-yellow-600" />,
  <Medal className="w-6 h-6 text-gray-500" />,
  <Medal className="w-6 h-6 text-orange-600" />,
];

export default function Leaderboard() {
  const { data: authors = [], isLoading } = useQuery<AuthorRank[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDD00] border-3 border-black rounded-xl shadow-[4px_4px_0px_black] mb-4">
          <Trophy className="w-5 h-5" />
          <span className="font-black text-sm uppercase tracking-widest">Leaderboard</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black" data-testid="text-page-title">Top Penulis CTRXL.ID</h1>
        <p className="text-black/60 font-semibold mt-1">Peringkat berdasarkan likes + views</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-4 border-black rounded-xl h-20 bg-gray-100 animate-pulse shadow-[4px_4px_0px_black]" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Belum ada data</h3>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {authors.map((author, i) => (
            <Link key={author.author} href={`/author/${encodeURIComponent(author.author)}`}>
              <div
                className={`border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center gap-4 ${i < 3 ? RANK_COLORS[i] : "bg-white"}`}
                data-testid={`row-leaderboard-${i}`}
              >
                <div className="w-12 h-12 border-3 border-black rounded-xl flex items-center justify-center bg-white/60 flex-shrink-0">
                  {i < 3 ? RANK_ICONS[i] : <span className="font-black text-lg text-black/50">#{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg truncate" data-testid={`text-author-${i}`}>{author.author}</h3>
                  <div className="flex items-center gap-3 text-sm font-bold text-black/50">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{author.totalQuotes}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{author.totalLikes}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-400" />{author.totalViews}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-2xl" data-testid={`text-score-${i}`}>{author.score.toLocaleString()}</div>
                  <div className="text-xs font-bold text-black/40">skor</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
