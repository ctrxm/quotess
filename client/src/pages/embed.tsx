import { useState } from "react";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Embed() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const origin = window.location.origin;

  const embedCode = `<div id="kataviral-widget" style="max-width:400px;font-family:'Space Grotesk',sans-serif"></div>
<script>
(function(){
  fetch('${origin}/api/embed/random')
    .then(r=>r.json())
    .then(q=>{
      var d=document.getElementById('kataviral-widget');
      d.innerHTML='<div style="border:3px solid #000;border-radius:12px;padding:20px;background:#FFF3B0;box-shadow:5px 5px 0 #000">'
        +'<p style="font-weight:700;font-size:18px;margin:0 0 12px">&ldquo;'+q.text+'&rdquo;</p>'
        +(q.author?'<p style="font-weight:600;color:#555;margin:0 0 8px">&mdash; '+q.author+'</p>':'')
        +'<a href="${origin}/q/'+q.id+'" target="_blank" style="font-size:12px;font-weight:700;color:#000;text-decoration:underline">KataViral</a>'
        +'</div>';
    });
})();
</script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: "Tersalin!", description: "Kode embed berhasil disalin" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8DBFF] border-3 border-black rounded-xl shadow-[4px_4px_0px_black] mb-4">
          <Code className="w-5 h-5" />
          <span className="font-black text-sm uppercase tracking-widest">Widget Embed</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black" data-testid="text-page-title">Pasang Widget Quote</h1>
        <p className="text-black/60 font-semibold mt-1">Tampilkan quote random dari KataViral di website kamu</p>
      </div>

      <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black] mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm uppercase tracking-widest">Kode Embed</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#C1F0C1] border-2 border-black rounded-lg font-black text-xs shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            data-testid="button-copy-embed"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Tersalin!" : "Salin Kode"}
          </button>
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto leading-relaxed" data-testid="text-embed-code">
          {embedCode}
        </pre>
      </div>

      <div className="border-4 border-black rounded-xl bg-[#FFF3B0] p-5 shadow-[6px_6px_0px_black] mb-6">
        <h3 className="font-black text-sm uppercase tracking-widest mb-3">Preview</h3>
        <div className="border-3 border-black rounded-xl p-5 bg-[#FFF3B0] shadow-[5px_5px_0px_black]">
          <p className="font-bold text-lg mb-3">&ldquo;Hidup itu seperti naik sepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak.&rdquo;</p>
          <p className="font-semibold text-black/60 mb-2">&mdash; Albert Einstein</p>
          <a href={origin} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline flex items-center gap-1">
            KataViral <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="border-4 border-black rounded-xl bg-white p-5 shadow-[6px_6px_0px_black]">
        <h3 className="font-black text-sm uppercase tracking-widest mb-3">Cara Pakai</h3>
        <ol className="list-decimal list-inside flex flex-col gap-2 text-sm font-semibold text-black/70">
          <li>Salin kode embed di atas</li>
          <li>Tempel di HTML website kamu, di posisi yang diinginkan</li>
          <li>Widget akan menampilkan quote random setiap kali halaman dibuka</li>
        </ol>
      </div>
    </div>
  );
}
