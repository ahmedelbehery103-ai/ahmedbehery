
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

/**
 * Suggests materials for an exhibition booth based on dimensions and event type.
 * Uses Gemini AI to provide a structured list of recommended local materials for the Egyptian market.
 */
export const suggestMaterials = async (dimensions: { l: number, w: number, h: number }, eventType: string): Promise<any[]> => {
  // Always initialize the client right before usage to ensure current API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Suggest a list of materials for an exhibition booth with dimensions:
    Length: ${dimensions.l}m, Width: ${dimensions.w}m, Height: ${dimensions.h}m.
    Event Type: ${eventType}
    Target Market: Egypt (Local materials like MDF, Muski, Banner, Vinyl).
    Format the output as a structured list with quantities.
  `;

  try {
    // Generate content using the model and prompt directly.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'The name of the material.'
              },
              quantity: {
                type: Type.NUMBER,
                description: 'The suggested quantity.'
              },
              unit: {
                type: Type.STRING,
                description: 'The unit of measurement (e.g., m2, Sheet, Pcs).'
              },
              reason: {
                type: Type.STRING,
                description: 'Brief reason for selecting this material.'
              }
            },
            required: ['name', 'quantity', 'unit'],
            propertyOrdering: ["name", "quantity", "unit", "reason"]
          }
        }
      }
    });

    // Access the generated text using the .text property (not a method).
    const text = response.text;
    if (!text) return [];
    
    // Safety check for parsing JSON
    try {
      const parsed = JSON.parse(text);
      // Ensure we return an array.
      return Array.isArray(parsed) ? (parsed as any[]) : [];
    } catch (parseError) {
      console.error("JSON parsing of Gemini response failed:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
    return [];
  }
};
