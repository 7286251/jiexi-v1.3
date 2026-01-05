
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = (customKey?: string) => {
  // Use custom key if provided, otherwise fallback to environment key
  return new GoogleGenAI({ apiKey: customKey || process.env.API_KEY || '' });
};

export const analyzeImage = async (base64Image: string, apiKey?: string): Promise<string> => {
  const ai = getAIClient(apiKey);
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  const textPart = {
    text: "Analyze this image in exhaustive JSON detail. Provide keys like subjects, colors, layout, style, mood, lighting, and textures. Only output the JSON string, no other text. No markdown formatting."
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
    }
  });

  return response.text || "{}";
};

export const modifyResult = async (currentJson: string, instruction: string, apiKey?: string, wordCount?: string): Promise<string> => {
  const ai = getAIClient(apiKey);
  const wordCountInstruction = wordCount ? `Ensure the output content is approximately ${wordCount} characters/words in total to fit platform limits.` : "";
  
  const prompt = `
    Input JSON:
    ${currentJson}
    
    Modification Request:
    ${instruction}
    
    ${wordCountInstruction}
    
    Rules:
    1. Output ONLY the updated JSON.
    2. DO NOT include any text like "Based on your request" or "Here is the updated JSON".
    3. DO NOT include markdown code blocks (no \`\`\`json).
    4. Ensure it is valid JSON.
    5. If a word count is specified, summarize or expand the JSON values to meet that length while maintaining descriptive quality.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  // Basic cleanup just in case model returns markdown
  let result = response.text || currentJson;
  result = result.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  
  return result;
};

export const translateJson = async (currentJson: string, targetLang: 'zh' | 'en', apiKey?: string): Promise<string> => {
  const ai = getAIClient(apiKey);
  const prompt = `
    Translate the values of this JSON to ${targetLang === 'zh' ? 'Chinese' : 'English'}. 
    Keep keys exactly as they are. Output ONLY valid JSON string.
    ${currentJson}
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  return response.text || currentJson;
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'test',
    });
    return true;
  } catch (e) {
    return false;
  }
};
