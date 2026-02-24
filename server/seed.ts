import { db } from "./storage";
import { quotes, tags, quoteTags } from "@shared/schema";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

const SEED_QUOTES = [
  { text: "Hidup itu bukan soal seberapa keras kamu jatuh, tapi seberapa cepat kamu bangkit.", author: "Anonim", mood: "semangat", tags: ["motivasi", "kehidupan"] },
  { text: "Kamu tidak bisa kembali dan mengubah awal, tapi kamu bisa mulai dari sekarang dan mengubah akhir.", author: "C.S. Lewis", mood: "semangat", tags: ["motivasi", "mindset"] },
  { text: "Rasa sakit itu sementara, tapi menyerah itu selamanya.", author: "Lance Armstrong", mood: "semangat", tags: ["motivasi", "produktif"] },
  { text: "Orang yang berhenti belajar adalah orang yang sudah tua, meskipun umurnya baru dua puluh tahun.", author: "Henry Ford", mood: "kerja", tags: ["mindset", "produktif"] },
  { text: "Kesuksesan bukan kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan.", author: "Albert Schweitzer", mood: "healing", tags: ["sukses", "kehidupan"] },
  { text: "Cinta itu bukan soal menemukan orang yang sempurna, tapi menerima orang yang tidak sempurna dengan sempurna.", author: "Sam Keen", mood: "cinta", tags: ["bucin", "patahhati"] },
  { text: "Galau itu lumrah, yang penting jangan sampai galau-mu menghalangi langkah-langkahmu.", author: "Fiersa Besari", mood: "galau", tags: ["patahhati", "moveon"] },
  { text: "Jangan pernah menyesal atas sesuatu yang pernah membuatmu tersenyum.", author: "Mark Twain", mood: "healing", tags: ["moveon", "kehidupan"] },
  { text: "Bukan seberapa pintar kamu, tapi seberapa kamu mau berusaha.", author: "Anonim", mood: "kerja", tags: ["produktif", "mindset"] },
  { text: "Waktu itu tidak menunggu siapapun. Mulai sekarang atau tidak sama sekali.", author: "Anonim", mood: "kerja", tags: ["produktif", "motivasi"] },
  { text: "Yang paling menyakitkan bukan ketika mereka pergi, tapi ketika kamu sadar kamu masih menunggu.", author: "Anonim", mood: "galau", tags: ["patahhati", "galau"] },
  { text: "Cinta bukan tentang berapa lama, tapi tentang seberapa dalam.", author: "Kahlil Gibran", mood: "cinta", tags: ["cinta", "bucin"] },
  { text: "Kamu tidak perlu disukai semua orang. Jadilah dirimu sendiri.", author: "Anonim", mood: "healing", tags: ["selflove", "mindset"] },
  { text: "Berhenti membandingkan hidupmu dengan orang lain. Kamu tidak tahu apa yang sudah mereka lalui.", author: "Anonim", mood: "healing", tags: ["selflove", "kehidupan"] },
  { text: "Rezeki tidak akan tertukar, jadi kenapa harus iri dengan milik orang lain?", author: "Anonim", mood: "healing", tags: ["kehidupan", "random"] },
  { text: "Kalau dia yang tepat, kamu tidak perlu berjuang sendirian.", author: "Anonim", mood: "cinta", tags: ["cinta", "patahhati"] },
  { text: "Move on bukan berarti melupakan, tapi belajar untuk hidup tanpanya.", author: "Anonim", mood: "galau", tags: ["moveon", "patahhati"] },
  { text: "Kerja keras tidak pernah bohong. Hasilnya mungkin terlambat, tapi pasti datang.", author: "Anonim", mood: "kerja", tags: ["produktif", "sukses"] },
  { text: "Senyum itu gratis, tapi nilainya luar biasa.", author: "Anonim", mood: "healing", tags: ["chill", "kehidupan"] },
  { text: "Yang dibutuhkan bukan selalu yang sempurna, tapi yang bisa hadir di saat yang tepat.", author: "Anonim", mood: "cinta", tags: ["cinta", "bucin"] },
  { text: "Jangan takut gagal, takutlah jika tidak pernah mencoba.", author: "Anonim", mood: "semangat", tags: ["motivasi", "mindset"] },
  { text: "Diam itu bukan berarti tidak punya pendapat, tapi memilih pertempuran yang tepat.", author: "Anonim", mood: "sindir", tags: ["random", "mindset"] },
  { text: "Orang-orang yang meremehkanmu hari ini, akan terpana melihatmu sukses esok hari.", author: "Anonim", mood: "sindir", tags: ["sukses", "motivasi"] },
  { text: "Beberapa orang datang dalam hidupmu sebagai berkah. Yang lain datang sebagai pelajaran.", author: "Anonim", mood: "healing", tags: ["kehidupan", "moveon"] },
  { text: "Terlalu baik kepada semua orang bukan kekuatan, itu kelemahan yang terlihat mulia.", author: "Anonim", mood: "sindir", tags: ["random", "mindset"] },
  { text: "Tidur cukup, makan teratur, olahraga rutin. Itu sudah setengah dari kesuksesan.", author: "Anonim", mood: "kerja", tags: ["produktif", "chill"] },
  { text: "Pertemanan yang baik bukan tentang seberapa sering bertemu, tapi seberapa tulus saling peduli.", author: "Anonim", mood: "healing", tags: ["friendship", "kehidupan"] },
  { text: "Sahabat terbaik adalah yang tahu seburuk apapun kamu, tapi tetap memilihmu.", author: "Anonim", mood: "healing", tags: ["friendship", "chill"] },
  { text: "Kadang doa terbaikmu bukan yang dikabulkan segera, tapi yang dijawab dengan sabar.", author: "Anonim", mood: "galau", tags: ["kehidupan", "random"] },
  { text: "Bukan soal seberapa jauh jatuhnya, tapi apakah kamu kembali berdiri.", author: "Rocky Balboa", mood: "semangat", tags: ["motivasi", "sukses"] },
  { text: "Hustle keras, tapi tetap jaga kesehatan mentalmu.", author: "Anonim", mood: "kerja", tags: ["produktif", "selflove"] },
  { text: "Yang paling bahaya adalah orang yang diam tapi menyimpan segalanya.", author: "Anonim", mood: "sindir", tags: ["random"] },
  { text: "Cemburu itu tanda sayang? Tidak. Itu tanda tidak percaya diri.", author: "Anonim", mood: "sindir", tags: ["bucin", "cinta"] },
];

const ALL_TAGS: Record<string, string> = {
  moveon: "Move On",
  produktif: "Produktif",
  sukses: "Sukses",
  patahhati: "Patah Hati",
  motivasi: "Motivasi",
  friendship: "Friendship",
  chill: "Chill",
  mindset: "Mindset",
  selflove: "Self Love",
  random: "Random",
  kehidupan: "Kehidupan",
  bucin: "Bucin",
  galau: "Galau",
  cinta: "Cinta",
};

export async function seedDatabase() {
  try {
    const [{ quoteCount }] = await db.select({ quoteCount: sql<number>`count(*)` }).from(quotes);
    if (Number(quoteCount) > 0) {
      console.log(`[seed] Database already has ${quoteCount} quotes, skipping seed.`);
      return;
    }

    console.log("[seed] Seeding database...");

    const tagMap = new Map<string, string>();
    for (const [slug, name] of Object.entries(ALL_TAGS)) {
      const id = randomUUID();
      await db.insert(tags).values({ id, name, slug }).onConflictDoNothing();
      tagMap.set(slug, id);
    }

    const existingTags = await db.select().from(tags);
    for (const tag of existingTags) tagMap.set(tag.slug, tag.id);

    for (const q of SEED_QUOTES) {
      const id = randomUUID();
      await db.insert(quotes).values({ id, text: q.text, author: q.author, mood: q.mood, status: "approved" });
      for (const tagSlug of q.tags) {
        let tagId = tagMap.get(tagSlug);
        if (!tagId) {
          const newTagId = randomUUID();
          await db.insert(tags).values({ id: newTagId, name: tagSlug, slug: tagSlug }).onConflictDoNothing();
          tagMap.set(tagSlug, newTagId);
          tagId = newTagId;
        }
        await db.insert(quoteTags).values({ quoteId: id, tagId }).onConflictDoNothing();
      }
    }

    console.log(`[seed] Seeded ${SEED_QUOTES.length} quotes successfully!`);
  } catch (e) {
    console.error("[seed] Error seeding:", e);
  }
}
