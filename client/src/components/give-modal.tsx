import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Flower, Star, Diamond, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { GiftType } from "@shared/schema";

const GIFT_ICONS: Record<string, React.ReactNode> = {
  rose: <Flower className="w-6 h-6 text-pink-500" />,
  star: <Star className="w-6 h-6 text-yellow-500" />,
  diamond: <Diamond className="w-6 h-6 text-blue-500" />,
  flower: <Flower className="w-6 h-6 text-purple-500" />,
};

interface GiveModalProps {
  quoteId: string;
  receiverId?: string;
  receiverName?: string;
  onClose: () => void;
}

export default function GiveModal({ quoteId, receiverId: initialReceiverId, receiverName: initialReceiverName, onClose }: GiveModalProps) {
  const [selectedGift, setSelectedGift] = useState<string>("");
  const [message, setMessage] = useState("");
  const [receiverId, setReceiverId] = useState(initialReceiverId || "");
  const [receiverName, setReceiverName] = useState(initialReceiverName || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; username: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: giftTypes = [] } = useQuery<GiftType[]>({
    queryKey: ["/api/gifts/types"],
    queryFn: () => fetch("/api/gifts/types").then((r) => r.json()),
  });

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { mutate: sendGift, isPending } = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gifts/send", {
      receiverId, giftTypeId: selectedGift, quoteId, message,
    }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Hadiah terkirim!", description: `Bunga berhasil dikirim ke @${receiverName}` });
      onClose();
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (!user?.isGiveEnabled) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative border-4 border-black rounded-xl bg-white shadow-[8px_8px_0px_black] w-full max-w-sm z-10">
        <div className="flex items-center justify-between p-4 border-b-3 border-black bg-[#FFF3B0] rounded-t-lg">
          <div className="flex items-center gap-2">
            <Flower className="w-5 h-5 text-pink-600" />
            <h3 className="font-black text-lg">Beri Hadiah</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 border-2 border-black rounded-md bg-white flex items-center justify-center hover:bg-gray-50" data-testid="button-close-give-modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <p className="font-black text-sm mb-1">Saldo Bunga Kamu</p>
            <div className="flex items-center gap-2 bg-[#C1F0C1] border-2 border-black rounded-lg px-3 py-2">
              <Flower className="w-4 h-4 text-green-700" />
              <span className="font-black text-lg">{user.flowersBalance}</span>
              <span className="text-sm font-semibold text-black/70">bunga</span>
            </div>
          </div>

          <div ref={searchRef} className="relative">
            <p className="font-black text-sm mb-1">Kirim ke</p>
            {receiverId ? (
              <div className="flex items-center justify-between bg-[#B8DBFF] border-2 border-black rounded-lg px-3 py-2">
                <span className="font-bold text-sm">@{receiverName}</span>
                <button
                  onClick={() => { setReceiverId(""); setReceiverName(""); setSearchQuery(""); }}
                  className="w-5 h-5 bg-white border border-black rounded flex items-center justify-center"
                  data-testid="button-clear-receiver"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 border-2 border-black rounded-lg px-3 py-2 bg-white">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari username..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="flex-1 text-sm font-semibold focus:outline-none bg-transparent"
                    data-testid="input-search-user"
                  />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_black] z-20 max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setReceiverId(u.id); setReceiverName(u.username); setShowDropdown(false); setSearchQuery(""); }}
                        className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-[#FFF3B0] transition-colors first:rounded-t-md last:rounded-b-md"
                        data-testid={`button-select-user-${u.username}`}
                      >
                        @{u.username}
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_black] z-20 px-3 py-2 text-sm text-gray-500 font-semibold">
                    User tidak ditemukan
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <p className="font-black text-sm mb-2">Pilih Hadiah</p>
            <div className="grid grid-cols-3 gap-2">
              {giftTypes.map((gt) => (
                <button
                  key={gt.id}
                  onClick={() => setSelectedGift(gt.id)}
                  disabled={(user.flowersBalance || 0) < gt.costFlowers}
                  className={`flex flex-col items-center gap-1 p-3 border-2 border-black rounded-lg transition-all text-sm font-bold ${selectedGift === gt.id ? "bg-[#FFF3B0] shadow-[2px_2px_0px_black]" : "bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  data-testid={`button-gift-${gt.id}`}
                >
                  {GIFT_ICONS[gt.icon] || <Flower className="w-6 h-6" />}
                  <span className="text-xs">{gt.name}</span>
                  <span className="text-xs text-gray-500">{gt.costFlowers} bunga</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-black text-sm mb-1 block">Pesan (opsional)</label>
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-semibold focus:outline-none"
              data-testid="input-give-message"
            />
          </div>

          <button
            onClick={() => sendGift()}
            disabled={!selectedGift || !receiverId || isPending}
            className="w-full py-3 bg-[#FFF3B0] border-3 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-send-gift"
          >
            {isPending ? "Mengirim..." : "Kirim Hadiah"}
          </button>
        </div>
      </div>
    </div>
  );
}
