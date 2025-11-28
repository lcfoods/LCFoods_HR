import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  /**
   * Chat with HR Assistant. Uses Flash for speed, Pro for complex reasoning.
   */
  async chatWithHR(message: string, isComplex: boolean = false): Promise<string> {
    try {
        const modelName = isComplex ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
        const thinkingConfig = isComplex ? { thinkingConfig: { thinkingBudget: 1024 } } : undefined;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: message,
            config: {
                systemInstruction: "You are an expert HR Assistant named 'Gemini HR'. You help HR staff draft policies, analyze employee issues, and provide professional advice. Keep answers professional and concise.",
                ...thinkingConfig
            }
        });
        return response.text || "I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Sorry, the HR assistant is currently unavailable.";
    }
  },

  /**
   * Verify an address using Google Maps Grounding
   */
  async verifyAddress(address: string): Promise<{ isValid: boolean; details: string; mapLink?: string }> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Verify if this address exists and provide details: ${address}`,
              config: {
                  tools: [{ googleMaps: {} }],
              }
          });

          // Extract grounding metadata
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          let mapLink = undefined;
          
          if (groundingChunks && groundingChunks.length > 0) {
               // Look for maps URI in chunks
               const mapChunk = groundingChunks.find(c => c.web?.uri?.includes('google.com/maps') || (c as any).maps?.uri);
               if (mapChunk) {
                   mapLink = mapChunk.web?.uri || (mapChunk as any).maps?.uri;
               }
          }

          return {
              isValid: !!mapLink,
              details: response.text || "Address verification completed.",
              mapLink
          };

      } catch (error) {
          console.error("Address Verification Error:", error);
          return { isValid: false, details: "Could not verify address at this time." };
      }
  },

  /**
   * Analyze a job description or text
   */
  async analyzeText(text: string): Promise<string> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: `Analyze the following text for HR compliance and tone: \n\n${text}`,
          });
          return response.text || "Analysis failed.";
      } catch (error) {
          return "Error analyzing text.";
      }
  }
};