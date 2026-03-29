import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY ortam değişkeni tanımlı değil.");
}

const ai = new GoogleGenAI({ apiKey });

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { message, transcript, history, quizResults } = json as {
    message: string;
    transcript: string;
    history: { role: string; text: string }[];
    quizResults?: {
      score: number;
      total: number;
      wrongQuestions?: { question: string; userAnswer: string; correctAnswer: string }[];
    };
  };

  if (!message || !transcript) {
    return NextResponse.json({ error: "Mesaj ve transkript gerekli." }, { status: 400 });
  }

  const historyText = history
    .map((h) => `${h.role === "user" ? "Öğrenci" : "Koç"}: ${h.text}`)
    .join("\n");

  const quizContext = quizResults
    ? `
ÖĞRENCİNİN SINAV SONUCU:
- Puan: ${quizResults.score}/${quizResults.total} (${Math.round((quizResults.score / quizResults.total) * 100)}%)
${quizResults.wrongQuestions?.length
  ? `- Yanlış cevaplanan sorular:\n${quizResults.wrongQuestions.map((q) => `  • Soru: ${q.question}\n    Öğrencinin cevabı: ${q.userAnswer}\n    Doğru cevap: ${q.correctAnswer}`).join("\n")}`
  : ""}
`
    : "";

  const prompt = `Sen Lecturai'ın AI öğrenci koçusun. Adın "Koç". Görevin öğrencilere gerçek bir koç gibi yardım etmek.

KİŞİLİĞİN:
- Samimi, motive edici ve anlayışlı
- Öğrencinin seviyesine göre konuşursun
- Gerektiğinde soru sorarak öğrenciyi yönlendirirsin
- Kısa ve net cevaplar verirsin (çok uzun yazma)
- Türkçe konuşursun

YAPABİLECEKLERİN:
1. Video içeriğiyle ilgili soruları transkripte dayanarak cevapla
2. Öğrenciye çalışma programı öner (sınav tarihi, ders saati gibi bilgileri sorarak)
3. Yanlış anladığı konuları tespit edip düzelt
4. Sınav stratejisi ver
5. Motivasyon ver ve odaklanmasına yardım et
6. Quiz sonuçlarına göre hangi konuları tekrar etmesi gerektiğini söyle

ÖNEMLİ KURALLAR:
- Videoda geçmeyen konular için "Bu bilgi videoda geçmiyor, ama genel olarak..." diyerek genel bilgi verebilirsin
- Öğrenci çalışma programı isterse önce sınav tarihini, günlük kaç saat çalışabileceğini sor
- Öğrenci yanlış anlamışsa nazikçe düzelt
- Cevapların 3-5 cümleyi geçmesin, gerekmedikçe

VİDEO TRANSKRİPTİ:
${transcript.slice(0, 40000)}

${quizContext}
${historyText ? `SOHBET GEÇMİŞİ:\n${historyText}\n` : ""}
Öğrenci: ${message}
Koç:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const text = response.text ?? "Bir hata oluştu.";
    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("[chat]", error);
    return NextResponse.json({ error: "Bir sorun oluştu, tekrar deneyin." }, { status: 502 });
  }
}
