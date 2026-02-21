import { GoogleGenAI } from "@google/genai";
import { policiesData } from "../data/policies";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const sendMessageStream = async function* (
  message: string,
  history: ChatMessage[],
) {
  const systemInstruction = `You are the "DAP Policy Smart Assistant". Your job is to answer employee questions about internal policies, such as Memorandum Circulars, Office Orders, and Special Orders.

Operational Guidelines:
1. Grounding is Absolute: You must answer ONLY using the information present in the provided policy documents. Do not use outside knowledge or make assumptions.
2. Missing Information: If the answer is not in the provided documents, you must state: "I cannot verify this information based on the current documents available in my database."
3. Citation is Mandatory: Every claim you make must be followed by a reference to the specific document. Format it like this: [Statement] (Reference: Office Order No. 2023-XX, Section 4).
4. Handling Conflicts: If two documents provide conflicting dates or rules, prioritize the document with the later date. Explicitly mention the update. For example, a 2024 Memorandum overrides a 2018 one.
5. Tone & Style: Maintain a professional, bureaucratic tone suitable for government employees. Use bullet points for steps or requirements.

Here are the embedded policy documents you must use as your knowledge base:
${policiesData}`;

  let promptText = "";
  if (history.length > 0) {
    promptText += "Previous conversation:\n";
    history.forEach((msg) => {
      promptText += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}\n\n`;
    });
    promptText += "Current question:\n";
  }
  promptText += message;

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: promptText,
    config: {
      systemInstruction,
    },
  });

  for await (const chunk of responseStream) {
    yield chunk.text;
  }
};
