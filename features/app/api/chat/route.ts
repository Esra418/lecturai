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

  const { message, transcript, history } = json as {
    message: string;
    transcript: string;
    history: { role: string; text: string }[];
  };

  if (!message || !transcript) {
    return NextResponse.json({ error: "Mesaj ve transkript gerekli." }, { status: 400 });
  }

  const historyText = history
    .map((h) => `${h.role === "user" ? "Öğrenci" : "Asistan"}: ${h.text}`)
    .join("\n");

  const prompt = `Sen LectuAI'ın AI asistanısın. Öğrencilere ders videolarını anlamalarında yardım ediyorsun.
Aşağıda bir YouTube ders videosunun transkripti var. Öğrencinin sorularını SADECE bu transkripte dayanarak Türkçe olarak cevapla.
Transkriptte olmayan bir şey sorulursa "Bu bilgi videoda geçmiyor" de.

VİDEO TRANSKRİPTİ:
${transcript.slice(0, 40000)}

${historyText ? `SOHBET GEÇMİŞİ:\n${historyText}\n` : ""}
Öğrenci: ${message}
Asistan:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text ?? "Bir hata oluştu.";
    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("[chat]", error);
    return NextResponse.json({ error: "Bir sorun oluştu, tekrar deneyin." }, { status: 502 });
  }
}