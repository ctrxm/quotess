import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flower, Landmark, Smartphone, Clock, Check, X, ArrowLeft } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WithdrawalMethod, WithdrawalRequest } from "@shared/schema";
import { MIN_WITHDRAWAL_FLOWERS, FLOWERS_TO_IDR_RATE } from "@shared/schema";

const schema = z.object({
  methodId: z.string().min(1, "Pilih metode penarikan"),
  accountNumber: z.string().min(5, "Nomor rekening/akun wajib diisi"),
  accountName: z.string().min(2, "Nama pemilik rekening wajib diisi"),
  flowersAmount: z.number().min(MIN_WITHDRAWAL_FLOWERS, `Minimum ${MIN_WITHDRAWAL_FLOWERS} bunga`),
});

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700 border-yellow-400" },
  approved: { label: "Disetujui", color: "bg-blue-100 text-blue-700 border-blue-400" },
  paid: { label: "Dibayar", color: "bg-green-100 text-green-700 border-green-400" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700 border-red-400" },
};

export default function Withdraw() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [flowersInput, setFlowersInput] = useState<number>(MIN_WITHDRAWAL_FLOWERS);

  const { data: methods = [] } = useQuery<WithdrawalMethod[]>({
    queryKey: ["/api/withdrawal/methods"],
    queryFn: () => fetch("/api/withdrawal/methods").then((r) => r.json()),
  });

  const { data: myRequests = [] } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal/my"],
    queryFn: () => fetch("/api/withdrawal/my", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { methodId: "", accountNumber: "", accountName: "", flowersAmount: MIN_WITHDRAWAL_FLOWERS },
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => apiRequest("POST", "/api/withdrawal/request", data).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Gagal", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Permintaan dikirim!", description: "Admin akan memproses dalam 1-3 hari kerja" });
      qc.invalidateQueries({ queryKey: ["/api/withdrawal/my"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      form.reset();
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (authLoading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 bg-gray-100 border-4 border-black rounded-xl animate-pulse shadow-[6px_6px_0px_black]" /></div>;
  if (!user) { navigate("/auth"); return null; }
  if (!user.isGiveEnabled) return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="border-4 border-black rounded-xl bg-[#FFF3B0] p-10 shadow-[8px_8px_0px_black]">
        <Flower className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-black mb-2">Fitur Give Belum Aktif</h2>
        <p className="font-semibold text-black/70">Fitur Give belum diaktifkan untuk akun kamu. Hubungi admin.</p>
        <Link href="/profile"><button className="mt-4 px-6 py-2 bg-black text-[#FFF3B0] font-black border-2 border-black rounded-lg shadow-[4px_4px_0px_#FFF3B0]">Kembali</button></Link>
      </div>
    </div>
  );

  const banks = methods.filter((m) => m.type === "bank");
  const ewallets = methods.filter((m) => m.type === "ewallet");
  const idrAmount = flowersInput * FLOWERS_TO_IDR_RATE;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/profile">
        <button className="mb-6 flex items-center gap-2 font-bold text-sm border-2 border-black px-4 py-2 rounded-lg bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid="button-back-withdraw">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </Link>

      <div className="border-4 border-black rounded-xl bg-[#FFF3B0] p-5 shadow-[6px_6px_0px_black] mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2"><Flower className="w-6 h-6" /> Tukar Bunga</h1>
        <p className="font-semibold text-sm text-black/70">Saldo: <strong>{user.flowersBalance} bunga</strong> = Rp {(user.flowersBalance * FLOWERS_TO_IDR_RATE).toLocaleString("id-ID")}</p>
        <p className="text-xs font-semibold text-black/50 mt-1">Rate: 100 bunga = Rp 1.000 | Minimum: {MIN_WITHDRAWAL_FLOWERS} bunga</p>
      </div>

      <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[6px_6px_0px_black] mb-6">
        <h2 className="font-black text-sm uppercase tracking-widest mb-4">Form Penarikan</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => submit(d))} className="flex flex-col gap-4">
            <FormField control={form.control} name="flowersAmount" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-sm">Jumlah Bunga</FormLabel>
                <FormControl>
                  <Input type="number" min={MIN_WITHDRAWAL_FLOWERS} max={user.flowersBalance} placeholder={String(MIN_WITHDRAWAL_FLOWERS)} className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0"
                    data-testid="input-flowers-amount"
                    {...field}
                    onChange={(e) => { const v = parseInt(e.target.value) || 0; field.onChange(v); setFlowersInput(v); }}
                  />
                </FormControl>
                <FormMessage />
                {flowersInput >= MIN_WITHDRAWAL_FLOWERS && <p className="text-sm font-bold text-green-600">= Rp {idrAmount.toLocaleString("id-ID")}</p>}
              </FormItem>
            )} />

            <FormField control={form.control} name="methodId" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-sm">Metode Penarikan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black]" data-testid="select-method">
                      <SelectValue placeholder="Pilih metode..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="border-2 border-black">
                    {banks.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-black text-gray-400 flex items-center gap-1"><Landmark className="w-3 h-3" /> Bank</div>
                        {banks.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </>
                    )}
                    {ewallets.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-black text-gray-400 flex items-center gap-1"><Smartphone className="w-3 h-3" /> E-Wallet</div>
                        {ewallets.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="accountNumber" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-sm">Nomor Rekening / Akun</FormLabel>
                <FormControl><Input placeholder="08xx / 1234567890" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-account-number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="accountName" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-sm">Nama Pemilik Rekening</FormLabel>
                <FormControl><Input placeholder="Nama sesuai rekening/akun" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-account-name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="border-t-2 border-black pt-4">
              <p className="text-xs text-gray-400 font-semibold mb-3">Proses 1-3 hari kerja. Bunga akan dikurangi saat submit.</p>
              <button type="submit" disabled={isPending || (user.flowersBalance || 0) < MIN_WITHDRAWAL_FLOWERS} className="w-full py-3 bg-[#FFF3B0] border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 text-sm" data-testid="button-submit-withdrawal">
                {isPending ? "Memproses..." : "Ajukan Penarikan"}
              </button>
            </div>
          </form>
        </Form>
      </div>

      {myRequests.length > 0 && (
        <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Riwayat Penarikan</h2>
          <div className="flex flex-col gap-3">
            {myRequests.map((req) => {
              const s = STATUS_MAP[req.status] || { label: req.status, color: "bg-gray-100 text-gray-600 border-gray-300" };
              return (
                <div key={req.id} className="border-2 border-black rounded-lg p-4" data-testid={`row-withdrawal-${req.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm">{req.flowersAmount} bunga</span>
                        <span className="text-sm font-bold text-gray-500">= Rp {req.idrAmount.toLocaleString("id-ID")}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{req.accountName} • {req.accountNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded border ${s.color}`}>{s.label}</span>
                  </div>
                  {req.adminNote && <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{req.adminNote}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
