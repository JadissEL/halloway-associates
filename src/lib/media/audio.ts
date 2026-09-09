import Groq from "groq-sdk";
import { toFile } from "groq-sdk";

// Real speech understanding via Groq's Whisper endpoint (whisper-large-v3 —
// confirmed live on this account's model catalog, unlike any vision model).
// This is the one leg of the "world-class multimodal" ask that's fully
// backed by a genuine, already-configured provider: same GROQ_API_KEY,
// same billing relationship, no new vendor.

export interface TranscriptionResult {
  text: string;
  language: string | null;
}

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<TranscriptionResult | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const file = await toFile(buffer, filename);
    const result = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });
    const text = (result as { text?: string }).text?.trim();
    if (!text) return null;
    const language = (result as { language?: string }).language ?? null;
    return { text, language };
  } catch (error) {
    console.error("[media:audio:transcribe]", error);
    return null;
  }
}

export interface ExtractedVoiceInfo {
  /** Free-form key/value pairs the model was confident enough to pull out (price, m2, bedrooms, city, ...). */
  fields: Record<string, string | number>;
  summary: string;
}

/**
 * Turns a natural-language transcript ("I want to sell my apartment in
 * Athens, 85 square meters, two bedrooms...") into structured fields a
 * listing draft can actually use (spec section 15). This is a cheap,
 * targeted extraction call — not the same as the full reasoning turn the
 * concierge itself runs; its only job is "pull out anything listing-shaped,"
 * the concierge decides what to do with it.
 */
export async function extractStructuredInfoFromText(text: string): Promise<ExtractedVoiceInfo | null> {
  if (!process.env.GROQ_API_KEY || !text.trim()) return null;
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract structured listing information from a transcribed voice message, in whatever language it's in. " +
            "Only include fields you're actually confident about — never guess a number or place name that wasn't stated. " +
            "Recognized field keys (use only the ones actually present): listingIntent (RENT or SALE), propertyType (ROOM, APARTMENT, HOUSE, LAND, COMMERCIAL), city, area, priceAmount (number, no currency symbol), bedrooms (number), furnished (true/false). " +
            'Respond with strict JSON: {"fields": {...}, "summary": "<one sentence summary of what the user said, in the same language they used>"}.',
        },
        { role: "user", content: text },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExtractedVoiceInfo;
    if (!parsed.fields) return null;
    return { fields: parsed.fields, summary: parsed.summary ?? text.slice(0, 200) };
  } catch (error) {
    console.error("[media:audio:extract]", error);
    return null;
  }
}
