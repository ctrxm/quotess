import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { useSettings } from "@/lib/settings";

export default function SiteNotification() {
  const settings = useSettings();
  const [dismissed, setDismissed] = useState(false);

  const key = `notif_dismissed_${settings.notificationMessage}`;

  useEffect(() => {
    if (settings.notificationType === "popup") {
      const wasDismissed = sessionStorage.getItem(key) === "1";
      setDismissed(wasDismissed);
    } else {
      setDismissed(false);
    }
  }, [settings.notificationMessage, settings.notificationType, key]);

  if (!settings.notificationEnabled || !settings.notificationMessage || dismissed) return null;

  const bg = settings.notificationBg || "#FFF3B0";
  const textColor = settings.notificationTextColor || "#000000";

  function dismiss() {
    sessionStorage.setItem(key, "1");
    setDismissed(true);
  }

  if (settings.notificationType === "banner") {
    return (
      <div
        className="w-full border-b-4 border-black flex items-center justify-between px-4 py-2.5 gap-3"
        style={{ backgroundColor: bg, color: textColor }}
        data-testid="site-banner"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Megaphone className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-black truncate">{settings.notificationMessage}</p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 w-6 h-6 border-2 border-current rounded flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label="Tutup notifikasi"
          data-testid="button-dismiss-banner"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" data-testid="site-popup-overlay">
      <div
        className="relative border-4 border-black rounded-2xl p-8 max-w-sm w-full shadow-[10px_10px_0px_black] text-center"
        style={{ backgroundColor: bg, color: textColor }}
        data-testid="site-popup"
      >
        <div
          className="w-12 h-12 border-3 border-current rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: textColor + "20" }}
        >
          <Megaphone className="w-6 h-6" />
        </div>
        <p className="font-black text-lg leading-snug mb-6">{settings.notificationMessage}</p>
        <button
          onClick={dismiss}
          className="px-6 py-2.5 border-3 border-current rounded-xl font-black text-sm shadow-[4px_4px_0px_currentColor] hover:shadow-[2px_2px_0px_currentColor] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          style={{ backgroundColor: textColor, color: bg }}
          data-testid="button-dismiss-popup"
        >
          Oke, Mengerti!
        </button>
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-7 h-7 border-2 border-current rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label="Tutup"
          data-testid="button-close-popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
