import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { BookOpen, Plus, ArrowLeft, Sparkles } from "lucide-react";
import QuoteCard from "@/components/quote-card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { CollectionWithMeta, QuoteWithTags } from "@shared/schema";

const COVER_COLORS = ["#FFDD00", "#4ADE80", "#60A5FA", "#FB923C", "#A855F7", "#F87171"];

function CollectionsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);

  const { data: collections = [], isLoading } = useQuery<CollectionWithMeta[]>({
    queryKey: ["/api/collections"],
  });

  const { mutate: createCollection, isPending } = useMutation({
    mutationFn: (data: { name: string; description: string; coverColor: string }) =>
      apiRequest("POST", "/api/collections", data).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/collections"] });
      setShowCreate(false);
      setName("");
      setDescription("");
      toast({ title: "Koleksi dibuat!" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-black" data-testid="text-page-title">Koleksi</h1>
          <p className="text-black/60 font-semibold mt-1">Kumpulan quote yang dikurasi</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4ADE80] border-3 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            data-testid="button-create-collection"
          >
            <Plus className="w-4 h-4" /> Buat Koleksi
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mb-8">
          <h3 className="font-black text-sm uppercase tracking-widest mb-4">Buat Koleksi Baru</h3>
          <div className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama koleksi..."
              className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold shadow-[2px_2px_0px_black]"
              data-testid="input-collection-name"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi (opsional)..."
              className="px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold shadow-[2px_2px_0px_black]"
              data-testid="input-collection-desc"
            />
            <div className="flex gap-2">
              {COVER_COLORS.map((c) => (
                <button key={c} onClick={() => setCoverColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 ${coverColor === c ? "border-black shadow-[2px_2px_0px_black]" : "border-gray-300"}`}
                  style={{ backgroundColor: c }} data-testid={`button-color-${c}`} />
              ))}
            </div>
            <button
              onClick={() => name.trim() && createCollection({ name: name.trim(), description: description.trim(), coverColor })}
              disabled={isPending || !name.trim()}
              className="px-4 py-2 bg-black text-[#FFDD00] font-black text-sm rounded-lg border-2 border-black shadow-[4px_4px_0px_#FFDD00] hover:shadow-[2px_2px_0px_#FFDD00] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
              data-testid="button-submit-collection"
            >
              {isPending ? "Membuat..." : "Buat Koleksi"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-4 border-black rounded-xl h-40 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-black mb-2">Belum ada koleksi</h3>
          <p className="text-gray-500 font-semibold">Buat koleksi pertamamu!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => (
            <Link key={col.id} href={`/collections/${col.id}`}>
              <div className="border-4 border-black rounded-xl shadow-[6px_6px_0px_black] hover:shadow-[3px_3px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer overflow-hidden h-full" data-testid={`card-collection-${col.id}`}>
                <div className="h-24 flex items-center justify-center relative" style={{ backgroundColor: col.coverColor }}>
                  {col.isPremium && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black text-[#FFDD00] text-xs font-black rounded flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Premium
                    </div>
                  )}
                  <BookOpen className="w-10 h-10 text-black/20" />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-black text-lg" data-testid={`text-collection-name-${col.id}`}>{col.name}</h3>
                  {col.description && <p className="text-sm text-gray-500 font-semibold mt-1 line-clamp-2">{col.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-bold text-black/50">{col.quoteCount} quote</span>
                    {col.curatorUsername && <span className="text-xs font-bold text-black/50">oleh @{col.curatorUsername}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionDetail() {
  const [, params] = useRoute("/collections/:id");
  const colId = params?.id || "";

  const { data, isLoading } = useQuery<{ collection: CollectionWithMeta; quotes: QuoteWithTags[] }>({
    queryKey: ["/api/collections", colId],
    enabled: !!colId,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="border-4 border-black rounded-xl h-40 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black] mb-8" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="border-4 border-black rounded-xl bg-white p-12 shadow-[6px_6px_0px_black]">
          <h2 className="text-2xl font-black mb-2">Koleksi tidak ditemukan</h2>
          <Link href="/collections">
            <button className="px-6 py-2 bg-black text-white font-black border-2 border-black rounded-lg shadow-[4px_4px_0px_#FFDD00] mt-4">
              Kembali
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { collection, quotes } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/collections">
        <span className="inline-flex items-center gap-1 text-sm font-bold cursor-pointer mb-6 hover:underline" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" /> Semua Koleksi
        </span>
      </Link>

      <div className="border-4 border-black rounded-xl shadow-[8px_8px_0px_black] overflow-hidden mb-8" style={{ backgroundColor: collection.coverColor }}>
        <div className="p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-black" data-testid="text-collection-title">{collection.name}</h1>
          {collection.description && <p className="text-lg font-semibold text-black/70 mt-2">{collection.description}</p>}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-bold">{collection.quoteCount} quote</span>
            {collection.curatorUsername && <span className="text-sm font-bold text-black/60">Dikurasi oleh @{collection.curatorUsername}</span>}
          </div>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="border-4 border-black rounded-xl bg-white p-12 text-center shadow-[6px_6px_0px_black]">
          <p className="text-gray-400 font-bold">Koleksi ini masih kosong</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quotes.map((q) => <QuoteCard key={q.id} quote={q} />)}
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  const [isDetail] = useRoute("/collections/:id");
  return isDetail ? <CollectionDetail /> : <CollectionsList />;
}
