import { GoogleGenAI, Content, Part } from "@google/genai";
import { SYSTEM_PROMPT_DOCS } from '../constants';

// Initialize the client ONLY if the key is present (handled in the call to avoid runtime errors on init)
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const sendMessageToGemini = async (
  userMessage: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key not configured.";

  try {
    // Format history for the API
    const historyContents: Content[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text } as Part],
    }));

    const model = 'gemini-2.5-flash'; 
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_PROMPT_DOCS,
        temperature: 0.2, // Keep it technical and precise
      },
      history: historyContents
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with AI Assistant. Please check console/network.";
  }
};
