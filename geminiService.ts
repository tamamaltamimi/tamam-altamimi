
import { GoogleGenAI, Type } from "@google/genai";
import { ParseResult, IntelligenceResult } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseYemenNetHtml = async (htmlContent: string): Promise<ParseResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the ADSL balance (Remaining GB) and Expiry Date from this Yemen Net HTML snippet. 
      HTML: ${htmlContent.substring(0, 5000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            balance: { type: Type.NUMBER, description: "Remaining balance in GB" },
            expiry: { type: Type.STRING, description: "Expiry date string" },
          },
          required: ["balance", "expiry"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      balance: result.balance || 0,
      expiry: result.expiry || 'غير معروف'
    };
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return { balance: 0, expiry: 'خطأ في التحليل', error: 'Failed to parse data' };
  }
};

/**
 * Uses Google Search Grounding to get real-time info about Yemen Net.
 */
export const getYemenNetIntelligence = async (): Promise<IntelligenceResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ما هي أحدث أخبار وحالة خدمة يمن نت (Yemen Net) اليوم؟ هل هناك صيانة أو تحديثات في الأسعار أو سرعات الإنترنت؟ لخص النتائج في بضعة أسطر.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      summary: response.text || "لا توجد معلومات جديدة حالياً.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Grounding Error:", error);
    return { summary: "تعذر الحصول على معلومات مباشرة حالياً.", sources: [] };
  }
};

export const simulateFetch = async (username: string): Promise<ParseResult> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const randomBalance = Math.floor(Math.random() * 20) + 1;
  const dates = ["2024-06-15", "2024-07-01", "2024-12-30"];
  const randomDate = dates[Math.floor(Math.random() * dates.length)];
  
  return {
    balance: randomBalance,
    expiry: randomDate
  };
};
