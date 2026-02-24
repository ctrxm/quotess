import { Wrench } from "lucide-react";
import { useSettings } from "@/lib/settings";

export default function MaintenanceScreen() {
  const settings = useSettings();
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="border-4 border-black rounded-xl bg-[#FFF3B0] p-10 max-w-md w-full text-center shadow-[10px_10px_0px_black]">
        <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#FFF3B0]">
          <Wrench className="w-8 h-8 text-[#FFF3B0]" />
        </div>
        <h1 className="text-3xl font-black mb-3">{settings.siteName}</h1>
        <h2 className="text-xl font-black mb-3">Sedang Maintenance</h2>
        <p className="font-semibold text-black/70">
          Website sedang dalam pemeliharaan. Silakan coba lagi beberapa saat lagi.
        </p>
      </div>
    </div>
  );
}
