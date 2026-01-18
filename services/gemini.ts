
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a world-class senior frontend engineer and UI/UX designer. 
Your task is to generate complete, high-quality, and modern React components using Tailwind CSS based on user prompts and optional images.

CRITICAL REQUIREMENT: RESPONSIVENESS
- You MUST ensure the component is fully responsive across all screen sizes (Mobile, Tablet, Desktop).
- Use Tailwind CSS responsive modifiers extensively.
- Adopt a 'Mobile-First' approach.

GENERAL GUIDELINES:
1. Always use Tailwind CSS for styling.
2. The component should be self-contained and ready to be rendered.
3. Use Lucide-like SVG icons where appropriate.
4. Ensure accessibility (aria-labels, proper contrast).
5. Use high-quality placeholder images from picsum.photos if needed.
6. Write clean, professional code.
7. Return ONLY a JSON object matching the requested schema. Do not add markdown backticks.

COMPONENT STRUCTURE:
- Your code MUST define a single functional component named 'Component'.
- Example structure:
  const Component = () => {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
      </div>
    );
  };
- DO NOT include any 'import' or 'export' statements.
- React hooks (useState, useEffect, etc.) are available globally.

SCHEMA:
{
  "code": "The full React component code as a string",
  "description": "A brief explanation of what was built and why"
}

If the user provides an image, treat it as a reference for layout, style, or specific UI elements they want to replicate or iterate on.`;

export async function generateComponent(prompt: string, history: any[] = [], imageBase64?: string) {
  // Initialize AI inside the function to avoid top-level 'process' errors
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contents = history.map(m => {
    const parts: any[] = [{ text: m.content }];
    if (m.image) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: m.image.split(',')[1] || m.image
        }
      });
    }
    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts
    };
  });

  const currentParts: any[] = [{ text: prompt }];
  if (imageBase64) {
    currentParts.push({
      inlineData: {
        mimeType: "image/png",
        data: imageBase64.split(',')[1] || imageBase64
      }
    });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["code", "description"]
        },
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

export async function getSmartSuggestions(description: string, code: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Based on this component description: "${description}" and its code, suggest 3 concise, high-impact next steps or improvements a user might want to make. Each suggestion should be a short phrase (max 6 words). 
  
  Return ONLY a JSON object: { "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.suggestions || [];
  } catch (error) {
    console.error("Suggestions Error:", error);
    return [];
  }
}

/**
 * Tool for generating specific visual assets for the UI
 */
export async function generateAsset(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (err) {
    console.error("Asset generation failed:", err);
  }
  return null;
}
