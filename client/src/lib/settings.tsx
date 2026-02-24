import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface PublicSettings {
  maintenanceMode: boolean;
  betaMode: boolean;
  betaAccessType: string;
  siteName: string;
  siteDescription: string;
  notificationEnabled: boolean;
  notificationType: string;
  notificationMessage: string;
  notificationBg: string;
  notificationTextColor: string;
}

const SettingsContext = createContext<PublicSettings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery<PublicSettings>({
    queryKey: ["/api/settings/public"],
    queryFn: () => fetch("/api/settings/public").then((r) => r.json()),
    staleTime: 30 * 1000,
  });

  const settings: PublicSettings = data || {
    maintenanceMode: false, betaMode: false, betaAccessType: "open",
    siteName: "KataViral", siteDescription: "Quote Indonesia yang Bikin Viral",
    notificationEnabled: false, notificationType: "banner",
    notificationMessage: "", notificationBg: "#FFF3B0", notificationTextColor: "#000000",
  };

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext)!;
}
