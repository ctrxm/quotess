import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { User, Heart, Eye, BookOpen, ArrowLeft, UserPlus, UserCheck, Users, BadgeCheck } from "lucide-react";
import { Link } from "wouter";
import QuoteCard from "@/components/quote-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { QuoteWithTags } from "@shared/schema";

interface AuthorData {
  author: string;
  quotes: QuoteWithTags[];
  stats: { totalQuotes: number; totalLikes: number; totalViews: number };
  isVerified?: boolean;
}

export default function Author() {
  const [, params] = useRoute("/author/:name");
  const authorName = params?.name ? decodeURIComponent(params.name) : "";
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<AuthorData>({
    queryKey: ["/api/author", encodeURIComponent(authorName)],
    enabled: !!authorName,
  });

  const { data: followData } = useQuery<{ following: boolean; followersCount: number }>({
    queryKey: ["/api/author", encodeURIComponent(authorName), "following"],
    enabled: !!authorName && !!user,
  });

  const { mutate: toggleFollow, isPending: isFollowPending } = useMutation({
    mutationFn: () => apiRequest("POST", `/api/author/${encodeURIComponent(authorName)}/follow`, {}).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/author", encodeURIComponent(authorName), "following"] });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-4 border-black rounded-lg shadow-[6px_6px_0px_black] bg-gray-100 h-52 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.quotes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/">
          <span className="inline-flex items-center gap-1 text-sm font-bold cursor-pointer mb-6 hover:underline" data-testid="link-back">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </span>
        </Link>
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <div className="text-6xl mb-4"><User className="w-16 h-16 mx-auto text-gray-300" /></div>
          <h3 className="text-xl font-black mb-2">Penulis tidak ditemukan</h3>
          <p className="text-gray-500 font-semibold">Tidak ada quote dari penulis "{authorName}"</p>
        </div>
      </div>
    );
  }

  const isFollowing = followData?.following || false;
  const followersCount = followData?.followersCount || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/">
        <span className="inline-flex items-center gap-1 text-sm font-bold cursor-pointer mb-6 hover:underline" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </span>
      </Link>

      <div className="mb-8">
        <div className="border-4 border-black bg-[#A855F7] rounded-xl p-6 md:p-10 shadow-[8px_8px_0px_black] relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-20">
            <User className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white border-3 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_black]">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-black text-black flex items-center gap-2" data-testid="text-author-name">
                {data.author}
                {data.isVerified && <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500 flex-shrink-0" data-testid="verified-badge-author" />}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold text-black/60 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {followersCount} pengikut
                </span>
              </div>
            </div>
            {user && (
              <button
                onClick={() => toggleFollow()}
                disabled={isFollowPending}
                className={`flex items-center gap-2 px-4 py-2 border-3 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${isFollowing ? "bg-black text-[#FFDD00]" : "bg-white"}`}
                data-testid="button-follow"
              >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? "Mengikuti" : "Ikuti"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="border-3 border-black bg-white rounded-lg p-3 shadow-[3px_3px_0px_black] text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1" />
              <div className="font-black text-2xl" data-testid="text-total-quotes">{data.stats.totalQuotes}</div>
              <div className="text-xs font-bold text-black/60">Quote</div>
            </div>
            <div className="border-3 border-black bg-white rounded-lg p-3 shadow-[3px_3px_0px_black] text-center">
              <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <div className="font-black text-2xl" data-testid="text-total-likes">{data.stats.totalLikes}</div>
              <div className="text-xs font-bold text-black/60">Likes</div>
            </div>
            <div className="border-3 border-black bg-white rounded-lg p-3 shadow-[3px_3px_0px_black] text-center">
              <Eye className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="font-black text-2xl" data-testid="text-total-views">{data.stats.totalViews}</div>
              <div className="text-xs font-bold text-black/60">Views</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-black mb-4">Semua Quote oleh {data.author}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}
