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
   * Verify an address using Google Maps Grounding with granular status and suggestions
   */
  async verifyAddress(address: string): Promise<{ status: 'valid' | 'partial' | 'invalid'; details: string; correction?: string; mapLink?: string; problematicField?: string }> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Verify this address: "${address}".
              Analyze its validity based on Google Maps data.
              
              Structure your response exactly as follows:
              1. Start with one tag: [VALID], [PARTIAL], or [INVALID].
              2. If a specific part is incorrect, add one tag: [ERROR_FIELD: PROVINCE], [ERROR_FIELD: DISTRICT], [ERROR_FIELD: WARD], or [ERROR_FIELD: STREET].
              3. Follow with a concise explanation of why.
              4. If the address is [PARTIAL] or [INVALID] but you can find a likely intended address, add the text "Suggestion: " followed by the corrected address.

              Example 1: [PARTIAL] [ERROR_FIELD: STREET] The street exists but the number 999 is out of range. Suggestion: 99 Le Duan, Hai Chau, Da Nang
              Example 2: [INVALID] [ERROR_FIELD: DISTRICT] The street "Tran Phu" is not found in district "Cau Giay". Suggestion: Tran Phu, Ha Dong, Hanoi`,
              config: {
                  tools: [{ googleMaps: {} }],
              }
          });

          const text = response.text || '';
          let status: 'valid' | 'partial' | 'invalid' = 'partial'; // Default to partial if unsure
          
          if (text.includes("[VALID]")) status = 'valid';
          else if (text.includes("[INVALID]")) status = 'invalid';
          else if (text.includes("[PARTIAL]")) status = 'partial';
          else {
              // Fallback logic based on grounding chunks presence
               const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
               if (chunks && chunks.length > 0) status = 'valid';
               else status = 'invalid';
          }

          // Parse Problematic Field
          let problematicField: string | undefined = undefined;
          if (text.includes("[ERROR_FIELD: PROVINCE]")) problematicField = 'provinceCode';
          else if (text.includes("[ERROR_FIELD: DISTRICT]")) problematicField = 'districtCode';
          else if (text.includes("[ERROR_FIELD: WARD]")) problematicField = 'wardCode';
          else if (text.includes("[ERROR_FIELD: STREET]")) problematicField = 'addressDetail';
          
          // Clean up text
          let cleanText = text
            .replace(/\[(VALID|PARTIAL|INVALID)\]/g, '')
            .replace(/\[ERROR_FIELD: \w+\]/g, '')
            .trim();
            
          let correction = undefined;

          // Extract Suggestion if present
          if (cleanText.includes("Suggestion:")) {
              const parts = cleanText.split("Suggestion:");
              cleanText = parts[0].trim();
              correction = parts[1].trim();
          }

          // Extract grounding metadata for map link
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
              status,
              details: cleanText || "Address check completed.",
              correction,
              mapLink,
              problematicField
          };

      } catch (error) {
          console.error("Address Verification Error:", error);
          return { status: 'invalid', details: "Could not verify address at this time due to an error." };
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
  },

  /**
   * Analyze a job title specifically for HR compliance
   */
  async analyzeJobTitle(jobTitle: string): Promise<string> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: `Analyze the job title "${jobTitle}" for a professional corporate environment.
              
              Provide a structured analysis covering:
              1. **Compliance Check**: Is it gender-neutral? (e.g., flag 'Salesman', suggest 'Sales Rep'). Is it inclusive?
              2. **Clarity Assessment**: Is it standard or too vague? (e.g., flag 'Ninja', 'Rockstar').
              3. **Alternatives**: Provide 2-3 specific, industry-standard alternative titles if the current one is non-standard.
              
              Keep the response concise, formatted with bullet points or short paragraphs suitable for a UI tooltip.`,
          });
          return response.text || "Job analysis failed.";
      } catch (error) {
          console.error("Job Analysis Error:", error);
          return "Error analyzing job title.";
      }
  }
};