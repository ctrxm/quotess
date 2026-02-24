import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Megaphone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Ad } from "@shared/schema";

interface AdCardProps {
  ad: Ad;
}

export default function AdCard({ ad }: AdCardProps) {
  const clickMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/ads/${ad.id}/click`),
  });

  function handleClick() {
    clickMutation.mutate();
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      data-testid={`ad-card-${ad.id}`}
      className="border-4 border-black rounded-xl shadow-[6px_6px_0px_black] overflow-hidden"
      style={{ backgroundColor: ad.bgColor || "#B8DBFF" }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 border-b-2 border-black bg-black/10">
        <Megaphone className="w-3 h-3" style={{ color: ad.textColor || "#000" }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: ad.textColor || "#000" }}>
          Iklan
        </span>
      </div>

      {ad.type === "image" && ad.imageUrl ? (
        <div className="relative">
          <img
            src={ad.imageUrl}
            alt={ad.title || "Iklan"}
            className="w-full object-cover max-h-48 border-b-2 border-black"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {(ad.title || ad.linkUrl) && (
            <div className="p-3">
              {ad.title && (
                <p className="font-black text-sm leading-snug" style={{ color: ad.textColor || "#000" }}>
                  {ad.title}
                </p>
              )}
              {ad.description && (
                <p className="text-xs font-semibold mt-1 opacity-80" style={{ color: ad.textColor || "#000" }}>
                  {ad.description}
                </p>
              )}
              {ad.linkUrl && (
                <button
                  onClick={handleClick}
                  data-testid={`button-ad-visit-${ad.id}`}
                  className="mt-2 flex items-center gap-1 text-xs font-black border-2 border-black px-3 py-1 rounded-md bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Kunjungi
                </button>
              )}
            </div>
          )}
          {!ad.title && ad.linkUrl && (
            <button
              onClick={handleClick}
              data-testid={`button-ad-visit-${ad.id}`}
              className="absolute bottom-2 right-2 flex items-center gap-1 text-xs font-black border-2 border-black px-3 py-1 rounded-md bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Kunjungi
            </button>
          )}
        </div>
      ) : (
        <div className="p-4">
          {ad.title && (
            <h3 className="font-black text-base leading-snug mb-1" style={{ color: ad.textColor || "#000" }}>
              {ad.title}
            </h3>
          )}
          {ad.description && (
            <p className="text-sm font-semibold leading-relaxed opacity-85" style={{ color: ad.textColor || "#000" }}>
              {ad.description}
            </p>
          )}
          {ad.linkUrl && (
            <button
              onClick={handleClick}
              data-testid={`button-ad-visit-${ad.id}`}
              className="mt-3 flex items-center gap-1 text-xs font-black border-2 border-black px-3 py-1.5 rounded-md bg-white shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Kunjungi
            </button>
          )}
        </div>
      )}
    </div>
  );
}
