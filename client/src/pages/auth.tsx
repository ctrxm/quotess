import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Feather, Eye, EyeOff, Lock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/lib/settings";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Min 3 karakter").max(30).regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, underscore"),
  password: z.string().min(6, "Min 6 karakter"),
  betaCode: z.string().optional(),
});

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const settings = useSettings();

  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const regForm = useForm({ resolver: zodResolver(registerSchema), defaultValues: { email: "", username: "", password: "", betaCode: "" } });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({ title: "Selamat datang kembali!" });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Login gagal", description: e.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await register({ email: data.email, username: data.username, password: data.password, betaCode: data.betaCode || undefined });
      toast({ title: "Selamat datang!", description: "Akun berhasil dibuat" });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Registrasi gagal", description: e.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#FFE34D] border-3 border-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[5px_5px_0px_black]">
            <Feather className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl font-black">{settings.siteName}</h1>
          <p className="text-gray-500 font-semibold text-sm mt-1">{settings.siteDescription}</p>
        </div>

        <div className="border-4 border-black rounded-xl bg-white shadow-[8px_8px_0px_black] overflow-hidden">
          <div className="grid grid-cols-2 border-b-4 border-black">
            {(["login", "register"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`py-3 font-black text-sm transition-all ${tab === t ? "bg-[#FFE34D] text-black" : "bg-white text-black/50 hover:bg-gray-50"}`} data-testid={`button-tab-${t}`}>
                {t === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "login" ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-sm">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@kamu.com" type="email" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0 focus:shadow-[1px_1px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all" data-testid="input-login-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-sm">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPass ? "text" : "password"} placeholder="Password..." className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0 focus:shadow-[1px_1px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all pr-10" data-testid="input-login-password" {...field} />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#FFE34D] border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 mt-2" data-testid="button-login">
                    {isLoading ? "Memuat..." : "Masuk"}
                  </button>
                </form>
              </Form>
            ) : (
              <Form {...regForm}>
                <form onSubmit={regForm.handleSubmit(handleRegister)} className="flex flex-col gap-4">
                  <FormField control={regForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-sm">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@kamu.com" type="email" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-reg-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={regForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-sm">Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username_kamu" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-reg-username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={regForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-sm">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min. 6 karakter" className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-reg-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {settings.betaMode && settings.betaAccessType === "code" && (
                    <FormField control={regForm.control} name="betaCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-black text-sm flex items-center gap-2"><Lock className="w-4 h-4" /> Kode Beta</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan kode beta..." className="border-2 border-black rounded-lg shadow-[3px_3px_0px_black] focus-visible:ring-0" data-testid="input-beta-code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  {settings.betaMode && (
                    <div className="bg-[#FFE34D] border-2 border-black rounded-lg p-3 text-sm font-semibold">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Website dalam mode Beta. {settings.betaAccessType === "waitlist" ? "Hanya pengguna waitlist yang bisa daftar." : settings.betaAccessType === "code" ? "Masukkan kode beta untuk daftar." : "Registrasi terbuka."}
                      {settings.betaAccessType === "waitlist" && <span className="block mt-1"><a href="/waitlist" className="font-black underline">Daftar waitlist</a></span>}
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full py-3 bg-black text-[#FFE34D] border-3 border-black rounded-lg font-black shadow-[5px_5px_0px_#FFE34D] hover:shadow-[2px_2px_0px_#FFE34D] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 mt-2" data-testid="button-register">
                    {isLoading ? "Memuat..." : "Buat Akun"}
                  </button>
                </form>
              </Form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 font-medium">
          Dengan mendaftar, kamu setuju dengan syarat & ketentuan KataViral
        </p>
      </div>
    </div>
  );
}
