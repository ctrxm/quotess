import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Feather, Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/lib/settings";

function InputField({ label, type = "text", placeholder, value, onChange, error, id, ...rest }: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string; id: string; [k: string]: any;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-black text-sm">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={isPass ? "current-password" : type === "email" ? "email" : "off"}
          className={`w-full px-3 py-2.5 border-2 border-black rounded-lg font-semibold text-sm outline-none transition-all focus:shadow-[2px_2px_0px_black] ${isPass ? "pr-10" : ""} ${error ? "border-red-500 bg-red-50" : "bg-white"}`}
          {...rest}
        />
        {isPass && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const settings = useSettings();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBetaCode, setRegBetaCode] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginEmail) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) errs.email = "Format email tidak valid";
    if (!loginPassword) errs.password = "Password wajib diisi";
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs: Record<string, string> = {};
    if (!regEmail) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = "Format email tidak valid";
    if (!regUsername) errs.username = "Username wajib diisi";
    else if (regUsername.length < 3) errs.username = "Min 3 karakter";
    else if (!/^[a-zA-Z0-9_]+$/.test(regUsername)) errs.username = "Hanya huruf, angka, underscore";
    if (!regPassword) errs.password = "Password wajib diisi";
    else if (regPassword.length < 6) errs.password = "Min 6 karakter";
    if (settings.betaMode && settings.betaAccessType === "code" && !regBetaCode) {
      errs.betaCode = "Kode beta wajib diisi";
    }
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast({ title: "Selamat datang kembali!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login gagal", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setIsLoading(true);
    try {
      await register({ email: regEmail, username: regUsername, password: regPassword, betaCode: regBetaCode || undefined });
      toast({ title: "Selamat datang!", description: "Akun berhasil dibuat" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Registrasi gagal", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#FFDD00] border-[3px] border-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[5px_5px_0px_black]">
            <Feather className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl font-black">{settings.siteName}</h1>
          <p className="text-gray-500 font-semibold text-sm mt-1">{settings.siteDescription}</p>
        </div>

        <div className="border-4 border-black rounded-xl bg-white shadow-[8px_8px_0px_black] overflow-hidden">
          <div className="grid grid-cols-2 border-b-4 border-black">
            {(["login", "register"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`py-3 font-black text-sm transition-colors ${tab === t ? "bg-[#FFDD00] text-black" : "bg-white text-black/50 hover:bg-gray-50"}`} data-testid={`button-tab-${t}`}>
                {t === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
                <InputField id="login-email" label="Email" type="email" placeholder="email@kamu.com" value={loginEmail} onChange={setLoginEmail} error={loginErrors.email} data-testid="input-login-email" />
                <InputField id="login-password" label="Password" type="password" placeholder="Password kamu..." value={loginPassword} onChange={setLoginPassword} error={loginErrors.password} data-testid="input-login-password" />
                <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#FFDD00] border-[3px] border-black rounded-lg font-black shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 mt-2 text-sm" data-testid="button-login">
                  {isLoading ? "Memuat..." : "Masuk"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
                <InputField id="reg-email" label="Email" type="email" placeholder="email@kamu.com" value={regEmail} onChange={setRegEmail} error={regErrors.email} data-testid="input-reg-email" autoComplete="email" />
                <InputField id="reg-username" label="Username" placeholder="username_kamu" value={regUsername} onChange={setRegUsername} error={regErrors.username} data-testid="input-reg-username" autoComplete="username" />
                <InputField id="reg-password" label="Password" type="password" placeholder="Min. 6 karakter" value={regPassword} onChange={setRegPassword} error={regErrors.password} data-testid="input-reg-password" autoComplete="new-password" />

                {settings.betaMode && settings.betaAccessType === "code" && (
                  <InputField id="reg-beta" label="Kode Beta" placeholder="Masukkan kode beta..." value={regBetaCode} onChange={setRegBetaCode} error={regErrors.betaCode} data-testid="input-beta-code" />
                )}

                {settings.betaMode && (
                  <div className="bg-[#FFDD00] border-2 border-black rounded-lg p-3 text-sm font-semibold flex items-start gap-2">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      Website dalam mode Beta. {settings.betaAccessType === "waitlist" ? "Hanya pengguna waitlist yang bisa daftar." : settings.betaAccessType === "code" ? "Masukkan kode beta untuk mendaftar." : "Registrasi terbuka."}
                      {settings.betaAccessType === "waitlist" && (
                        <Link href="/waitlist"><span className="font-black underline cursor-pointer block mt-1">Daftar waitlist →</span></Link>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full py-3 bg-black text-[#FFDD00] border-[3px] border-black rounded-lg font-black shadow-[5px_5px_0px_#FFDD00] hover:shadow-[2px_2px_0px_#FFDD00] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 mt-2 text-sm" data-testid="button-register">
                  {isLoading ? "Memuat..." : "Buat Akun"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 font-medium">
          Dengan mendaftar, kamu setuju dengan syarat & ketentuan {settings.siteName}
        </p>
      </div>
    </div>
  );
}
