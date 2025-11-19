import { GoogleGenAI, Type } from "@google/genai";
import { Tap, GeminiRecommendation } from '../types';

// Helper to get the API key safely
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

export const getOrderRecommendations = async (taps: Tap[]): Promise<GeminiRecommendation | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API Key not found. Mocking AI response.");
    return null; 
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct a prompt based on current tap data
    const tapSummary = taps.map(t => 
      `- ${t.beerName} (${t.beerType}): ${((t.currentLevelLiters/t.kegSizeLiters)*100).toFixed(1)}% remaining. Total consumed: ${t.totalConsumedLiters.toFixed(0)}L.`
    ).join('\n');

    const prompt = `
      Act as a smart inventory manager for a pub.
      Here is the current status of the connected beer taps:
      ${tapSummary}

      Based on the consumption levels (Total consumed) and current keg levels:
      1. Identify which beers are most popular.
      2. Recommend which kegs need to be ordered urgently.
      3. Suggest a promotional strategy for the least popular beer.
      
      Format the output as JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief executive summary of the pub's beer status." },
            orderList: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "List of specific kegs to order." 
            },
            trendAnalysis: { type: Type.STRING, description: "Analysis of popularity and promo suggestion." }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as GeminiRecommendation;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback or error handling
    return null;
  }
};
