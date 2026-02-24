import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, CheckCircle, Mail } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/lib/settings";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  name: z.string().min(2, "Nama min 2 karakter").max(50).optional().or(z.literal("")),
});

export default function Waitlist() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const settings = useSettings();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", name: "" } });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/waitlist", data);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal mendaftar");
      }
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="border-4 border-black rounded-xl bg-[#C1F0C1] p-10 shadow-[8px_8px_0px_black]">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-black" />
          <h2 className="text-2xl font-black mb-2">Berhasil Terdaftar!</h2>
          <p className="font-semibold text-black/70 mb-4">
            Email kamu sudah masuk waitlist. Kami akan menghubungi kamu saat beta access tersedia.
          </p>
          <a href="/" className="px-6 py-3 bg-black text-[#C1F0C1] font-black border-3 border-black rounded-lg shadow-[4px_4px_0px_#333] inline-block">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#B8DBFF] border-3 border-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[5px_5px_0px_black]">
          <Clock className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-3xl font-black">Waitlist Beta</h1>
        <p className="text-gray-500 font-semibold text-sm mt-1">
          {settings.siteName} saat ini dalam mode beta. Daftar untuk mendapat akses pertama!
        </p>
      </div>

      <div className="border-4 border-black rounded-xl bg-white shadow-[8px_8px_0px_black] p-6">
        <div className="bg-[#FFF3B0] border-2 border-black rounded-lg p-3 mb-5 text-sm font-semibold flex items-start gap-2">
          <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Kami akan mengirim kode akses beta ke email kamu saat slot tersedia.</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-sm">Nama (opsional)</FormLabel>
                <FormControl>
                  <Input placeholder="Nama kamu..." className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-waitlist-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-sm">Email *</FormLabel>
                <FormControl>
                  <Input placeholder="email@kamu.com" type="email" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-waitlist-email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#FFF3B0] border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 text-sm" data-testid="button-join-waitlist">
              {isLoading ? "Mendaftar..." : "Daftar Waitlist"}
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
}
