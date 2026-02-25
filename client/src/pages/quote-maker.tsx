import { useState, useRef, useCallback } from "react";
import { Download, Type, Palette, RotateCcw, Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MOODS, MOOD_LABELS, type Mood } from "@shared/schema";

const BG_PRESETS = [
  { name: "Kuning", value: "#FFDD00", text: "#000000" },
  { name: "Hijau", value: "#4ADE80", text: "#000000" },
  { name: "Biru", value: "#60A5FA", text: "#000000" },
  { name: "Oranye", value: "#FB923C", text: "#000000" },
  { name: "Ungu", value: "#A855F7", text: "#000000" },
  { name: "Merah", value: "#F87171", text: "#000000" },
  { name: "Hitam", value: "#1a1a1a", text: "#FFFFFF" },
  { name: "Navy", value: "#1e3a5f", text: "#FFFFFF" },
  { name: "Gradient Pink", value: "linear-gradient(135deg, #F87171, #A855F7)", text: "#000000" },
  { name: "Gradient Biru", value: "linear-gradient(135deg, #60A5FA, #4ADE80)", text: "#000000" },
  { name: "Gradient Sunset", value: "linear-gradient(135deg, #FB923C, #F87171)", text: "#000000" },
  { name: "Gradient Gelap", value: "linear-gradient(135deg, #1a1a1a, #1e3a5f)", text: "#FFFFFF" },
];

const FONT_OPTIONS = [
  { name: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { name: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { name: "Sans-serif", value: "Arial, Helvetica, sans-serif" },
  { name: "Monospace", value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [
  { name: "Kecil", value: "18px" },
  { name: "Sedang", value: "24px" },
  { name: "Besar", value: "32px" },
  { name: "Jumbo", value: "40px" },
];

export default function QuoteMaker() {
  const [quoteText, setQuoteText] = useState("Tulis quote kamu di sini...");
  const [author, setAuthor] = useState("");
  const [bgIndex, setBgIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const bg = BG_PRESETS[bgIndex];
  const font = FONT_OPTIONS[fontIndex];
  const size = FONT_SIZES[sizeIndex];

  const isGradient = bg.value.startsWith("linear-gradient");
  const bgStyle = isGradient
    ? { background: bg.value, color: bg.text }
    : { backgroundColor: bg.value, color: bg.text };

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `kataviral-quote.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Berhasil!", description: "Gambar quote berhasil diunduh" });
    } catch {
      toast({ title: "Gagal", description: "Tidak bisa mengunduh gambar. Coba screenshot manual.", variant: "destructive" });
    }
  }, [toast]);

  const handleCopy = async () => {
    const text = `"${quoteText}"${author ? ` — ${author}` : ""}\n\n#CTRXLID`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Tersalin!", description: "Teks quote disalin ke clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setQuoteText("Tulis quote kamu di sini...");
    setAuthor("");
    setBgIndex(0);
    setFontIndex(0);
    setSizeIndex(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-black mb-2" data-testid="text-page-title">Quote Maker</h1>
        <p className="text-black/60 font-semibold">Buat quote visual kamu sendiri dengan pilihan background dan font</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="border-4 border-black rounded-xl p-5 bg-white shadow-[6px_6px_0px_black]">
            <label className="font-black text-sm uppercase tracking-wider mb-2 block">Teks Quote</label>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="w-full h-32 p-3 border-3 border-black rounded-lg font-semibold resize-none focus:outline-none focus:shadow-[2px_2px_0px_black] transition-all"
              maxLength={500}
              data-testid="input-quote-text"
            />
            <p className="text-xs font-semibold text-black/40 mt-1">{quoteText.length}/500</p>
          </div>

          <div className="border-4 border-black rounded-xl p-5 bg-white shadow-[6px_6px_0px_black]">
            <label className="font-black text-sm uppercase tracking-wider mb-2 block">Nama Penulis</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Opsional: nama penulis"
              className="w-full p-3 border-3 border-black rounded-lg font-semibold focus:outline-none focus:shadow-[2px_2px_0px_black] transition-all"
              data-testid="input-author"
            />
          </div>

          <div className="border-4 border-black rounded-xl p-5 bg-white shadow-[6px_6px_0px_black]">
            <label className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Background
            </label>
            <div className="grid grid-cols-6 gap-2">
              {BG_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => setBgIndex(i)}
                  className={`w-full aspect-square rounded-lg border-3 transition-all ${bgIndex === i ? "border-black shadow-[3px_3px_0px_black] scale-110" : "border-black/20 hover:border-black"}`}
                  style={preset.value.startsWith("linear") ? { background: preset.value } : { backgroundColor: preset.value }}
                  title={preset.name}
                  data-testid={`button-bg-${i}`}
                />
              ))}
            </div>
          </div>

          <div className="border-4 border-black rounded-xl p-5 bg-white shadow-[6px_6px_0px_black]">
            <label className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" /> Font
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setFontIndex(i)}
                  className={`px-3 py-2 text-sm font-bold border-2 border-black rounded-md transition-all ${fontIndex === i ? "bg-black text-white shadow-[2px_2px_0px_#FFDD00]" : "bg-white hover:shadow-[2px_2px_0px_black]"}`}
                  style={{ fontFamily: f.value }}
                  data-testid={`button-font-${i}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-4 border-black rounded-xl p-5 bg-white shadow-[6px_6px_0px_black]">
            <label className="font-black text-sm uppercase tracking-wider mb-3 block">Ukuran Teks</label>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SIZES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSizeIndex(i)}
                  className={`px-3 py-2 text-sm font-bold border-2 border-black rounded-md transition-all ${sizeIndex === i ? "bg-black text-white shadow-[2px_2px_0px_#FFDD00]" : "bg-white hover:shadow-[2px_2px_0px_black]"}`}
                  data-testid={`button-size-${i}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24">
            <div
              ref={canvasRef}
              className="border-4 border-black rounded-xl shadow-[8px_8px_0px_black] overflow-hidden"
              style={{ ...bgStyle, minHeight: "400px" }}
              data-testid="preview-canvas"
            >
              <div className="p-8 md:p-12 flex flex-col justify-center min-h-[400px]">
                <div className="text-6xl font-black opacity-20 mb-4 select-none">&ldquo;</div>
                <blockquote
                  className="font-bold leading-relaxed mb-6"
                  style={{ fontFamily: font.value, fontSize: size.value }}
                >
                  {quoteText}
                </blockquote>
                {author && (
                  <p className="text-sm font-semibold opacity-70" style={{ fontFamily: font.value }}>
                    — {author}
                  </p>
                )}
                <div className="mt-6 pt-4 border-t border-current opacity-30">
                  <span className="text-xs font-black tracking-widest">KATAVIRAL</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-[#FFDD00] font-black text-sm border-3 border-black rounded-lg shadow-[4px_4px_0px_#333] hover:shadow-[2px_2px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" /> Unduh
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white font-black text-sm border-3 border-black rounded-lg shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                data-testid="button-copy-text"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Salin
              </button>
              <button
                onClick={async () => {
                  const text = `"${quoteText}"${author ? ` — ${author}` : ""}`;
                  if (navigator.share) {
                    try { await navigator.share({ title: "CTRXL.ID Quote", text }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(text);
                    toast({ title: "Tersalin!" });
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white font-black text-sm border-3 border-black rounded-lg shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4" /> Bagikan
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 font-black text-sm border-3 border-black rounded-lg shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-red-600"
                data-testid="button-reset"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
