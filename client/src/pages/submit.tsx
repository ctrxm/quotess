import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Send, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitQuoteSchema, type SubmitQuote, MOODS, MOOD_LABELS, MOOD_COLORS } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { Mood } from "@shared/schema";

export default function Submit() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<SubmitQuote>({
    resolver: zodResolver(submitQuoteSchema),
    defaultValues: {
      text: "",
      author: "",
      mood: "semangat",
      tags: [],
    },
  });

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      const newTags = [...tags, t];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (t: string) => {
    const newTags = tags.filter((x) => x !== t);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: SubmitQuote) => apiRequest("POST", "/api/quotes", data),
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      setTags([]);
      setTagInput("");
    },
    onError: (e: any) => {
      toast({ title: "Gagal submit", description: e.message || "Terjadi kesalahan", variant: "destructive" });
    },
  });

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="border-4 border-black rounded-xl bg-[#A8FF78] p-10 shadow-[8px_8px_0px_black]">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-black" />
          <h2 className="text-2xl font-black mb-2">Quote Berhasil Dikirim!</h2>
          <p className="font-semibold text-black/70 mb-6">
            Quote kamu sedang dalam proses moderasi dan akan segera muncul setelah disetujui. Terima kasih!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-3 bg-black text-[#A8FF78] font-black border-3 border-black rounded-lg shadow-[4px_4px_0px_#333] hover:shadow-[2px_2px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              data-testid="button-submit-another"
            >
              Submit Lagi
            </button>
            <a href="/" className="px-6 py-3 bg-white text-black font-black border-3 border-black rounded-lg shadow-[4px_4px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center">
              Ke Beranda
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#A8FF78] border-3 border-black rounded-lg shadow-[4px_4px_0px_black] flex items-center justify-center">
            <Send className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-3xl font-black">Submit Quote</h1>
        </div>
        <p className="text-gray-600 font-semibold">Bagikan kata-kata yang menginspirasi kamu!</p>
      </div>

      <div className="border-4 border-black rounded-xl bg-white p-6 shadow-[6px_6px_0px_black]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutate(d))} className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-black text-sm uppercase tracking-wide">Quote *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tulis quote yang ingin kamu bagikan... (min. 10 karakter)"
                      className="border-2 border-black rounded-lg min-h-28 font-semibold resize-none shadow-[3px_3px_0px_black] focus:shadow-[1px_1px_0px_black] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                      data-testid="input-quote-text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-semibold" />
                  <p className="text-xs text-gray-400 font-medium">{field.value.length}/500 karakter</p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-black text-sm uppercase tracking-wide">Penulis (opsional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama penulis atau sumber..."
                      className="border-2 border-black rounded-lg font-semibold shadow-[3px_3px_0px_black] focus:shadow-[1px_1px_0px_black] focus-visible:ring-0 focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                      data-testid="input-author"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-semibold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-black text-sm uppercase tracking-wide">Mood *</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {MOODS.map((mood) => {
                      const colors = MOOD_COLORS[mood as Mood];
                      const isSelected = field.value === mood;
                      return (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => field.onChange(mood)}
                          className={`py-2 px-3 font-bold text-sm border-2 border-black rounded-lg transition-all duration-100 ${
                            isSelected
                              ? `${colors.bg} ${colors.text} shadow-[2px_2px_0px_black]`
                              : "bg-white shadow-[3px_3px_0px_black] hover:shadow-[1px_1px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                          }`}
                          data-testid={`button-select-mood-${mood}`}
                        >
                          {MOOD_LABELS[mood as Mood]}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage className="font-semibold" />
                </FormItem>
              )}
            />

            <div>
              <label className="font-black text-sm uppercase tracking-wide block mb-2">Tags (maks. 5)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Tambah tag... (enter untuk tambah)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="border-2 border-black rounded-lg font-semibold shadow-[3px_3px_0px_black] focus:shadow-[1px_1px_0px_black] focus-visible:ring-0 focus:translate-x-[2px] focus:translate-y-[2px] transition-all flex-1"
                  data-testid="input-tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-black text-white font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_#555] hover:shadow-[1px_1px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm"
                  data-testid="button-add-tag"
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFE34D] border-2 border-black rounded-md font-bold text-xs shadow-[2px_2px_0px_black]">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} data-testid={`button-remove-tag-${t}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-black pt-4">
              <p className="text-xs text-gray-500 font-semibold mb-4">
                Quote akan ditinjau sebelum ditampilkan. Pastikan konten tidak mengandung ujaran kebencian atau spam.
              </p>
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-[#FFE34D] text-black font-black border-3 border-black rounded-lg shadow-[5px_5px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                data-testid="button-submit-quote"
              >
                {isPending ? "Mengirim..." : "Kirim Quote"}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
