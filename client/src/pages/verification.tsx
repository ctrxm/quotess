import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BadgeCheck, Send, Clock, CheckCircle, XCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface VerificationRequestData {
  id: string;
  userId: string;
  reason: string;
  socialLink?: string | null;
  status: "pending" | "approved" | "rejected";
  adminNote?: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Menunggu Review", bg: "bg-yellow-100 border-yellow-400 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  approved: { label: "Disetujui", bg: "bg-green-100 border-green-400 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "Ditolak", bg: "bg-red-100 border-red-400 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function Verification() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: request, isLoading } = useQuery<VerificationRequestData | null>({
    queryKey: ["/api/verification/my"],
    enabled: !!user,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => apiRequest("POST", "/api/verification/apply", { reason, socialLink: socialLink || undefined }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Pengajuan terkirim!", description: "Admin akan mereview pengajuanmu" });
      qc.invalidateQueries({ queryKey: ["/api/verification/my"] });
      setShowForm(false);
      setReason("");
      setSocialLink("");
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  if (authLoading || isLoading) return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="border-4 border-black rounded-xl h-64 bg-gray-100 animate-pulse shadow-[6px_6px_0px_black]" />
    </div>
  );

  if (!user) return null;

  if (user.isVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href="/profile">
          <span className="inline-flex items-center gap-1 text-sm font-bold cursor-pointer mb-6 hover:underline" data-testid="link-back">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </span>
        </Link>
        <div className="border-4 border-black rounded-xl bg-[#60A5FA] p-8 shadow-[8px_8px_0px_black] text-center">
          <BadgeCheck className="w-16 h-16 text-blue-500 fill-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Akun Terverifikasi</h2>
          <p className="font-semibold text-black/70">Akunmu sudah mendapatkan centang biru. Terima kasih!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">
      <Link href="/profile">
        <span className="inline-flex items-center gap-1 text-sm font-bold cursor-pointer hover:underline" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </span>
      </Link>

      <div className="border-4 border-black rounded-xl bg-[#60A5FA] p-6 shadow-[8px_8px_0px_black]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white border-3 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_black]">
            <BadgeCheck className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Centang Biru</h1>
            <p className="text-sm font-semibold text-black/60">Verifikasi akun kamu</p>
          </div>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-black/80">
            Centang biru menandakan bahwa akunmu sudah diverifikasi oleh CTRXL.ID. Badge ini akan muncul di samping username kamu di seluruh platform.
          </p>
          <p className="text-xs font-semibold text-black/50">
            Syarat: Akun aktif, konten berkualitas, dan identitas terverifikasi.
          </p>
        </div>
      </div>

      {request && !showForm && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          <h2 className="font-black text-sm uppercase tracking-widest mb-3">Status Pengajuan</h2>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-bold mb-3 ${STATUS_CONFIG[request.status]?.bg}`}>
            {STATUS_CONFIG[request.status]?.icon}
            <span>{STATUS_CONFIG[request.status]?.label}</span>
          </div>
          <p className="text-xs text-gray-500 font-semibold mb-2 border-l-2 border-gray-300 pl-2 italic">"{request.reason}"</p>
          {request.socialLink && (
            <a href={request.socialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-2">
              <ExternalLink className="w-3 h-3" /> {request.socialLink}
            </a>
          )}
          {request.adminNote && (
            <p className="text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded p-2 mt-2">
              Catatan admin: {request.adminNote}
            </p>
          )}
          {request.status === "rejected" && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs font-black text-blue-700 underline"
              data-testid="button-reapply"
            >
              Ajukan ulang
            </button>
          )}
        </div>
      )}

      {(!request || (request.status === "rejected" && showForm)) && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          {!showForm && !request ? (
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-500" />
                Ajukan Verifikasi
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                {[
                  { icon: <BadgeCheck className="w-6 h-6 text-blue-500 mx-auto" />, title: "Kepercayaan", desc: "Tanda akun terpercaya" },
                  { icon: <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />, title: "Visibilitas", desc: "Lebih mudah ditemukan" },
                  { icon: <Send className="w-6 h-6 text-purple-500 mx-auto" />, title: "Kredibilitas", desc: "Quote lebih dipercaya" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="border-2 border-black rounded-lg p-3 bg-gray-50">
                    <div className="mb-2">{icon}</div>
                    <p className="font-black text-xs">{title}</p>
                    <p className="text-gray-500 text-xs leading-tight mt-1">{desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 bg-[#60A5FA] border-2 border-black rounded-lg font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                data-testid="button-open-verify"
              >
                <BadgeCheck className="w-4 h-4" />
                Ajukan Centang Biru
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4">
              <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-500" />
                Form Pengajuan
              </h2>
              <div>
                <label className="font-black text-sm block mb-1">Alasan Pengajuan</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ceritakan kenapa kamu layak mendapat centang biru..."
                  className="w-full border-2 border-black rounded-lg shadow-[3px_3px_0px_black] p-3 text-sm resize-none focus:outline-none"
                  rows={4}
                  data-testid="textarea-verify-reason"
                />
                <p className="text-xs text-gray-400 mt-1">Minimal 10 karakter</p>
              </div>
              <div>
                <label className="font-black text-sm block mb-1">Link Sosmed / Portofolio <span className="font-normal text-gray-400">(opsional)</span></label>
                <input
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full border-2 border-black rounded-lg shadow-[3px_3px_0px_black] p-3 text-sm focus:outline-none"
                  data-testid="input-verify-social"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border-2 border-black rounded-lg font-black text-sm bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  data-testid="button-cancel-verify"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || reason.length < 10}
                  className="flex-[2] py-2.5 bg-[#60A5FA] border-2 border-black rounded-lg font-black text-sm shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="button-submit-verify"
                >
                  <Send className="w-4 h-4" />
                  {isPending ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
