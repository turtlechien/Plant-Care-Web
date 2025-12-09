import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Identify Plant by Image
export const identifyPlant = async (imageBase64: string) => {
  const ai = getAI();
  const prompt = "Identify this plant. Return the common name, scientific name, typical watering frequency in days (integer only, approximate average), and preferred light level (Full Sun, Partial Shade, Indirect Light, Low Light).";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            waterFreqDays: { type: Type.INTEGER },
            lightNeed: { type: Type.STRING }
          },
          required: ["name", "scientificName", "waterFreqDays", "lightNeed"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("AI Identify Error", e);
    throw e;
  }
};

// 1.5 Identify Plant by Name (Text)
export const identifyPlantByName = async (plantName: string) => {
  const ai = getAI();
  const prompt = `Provide care details for a plant named "${plantName}". Return the scientific name, typical watering frequency in days (integer only, approximate average), and preferred light level (Full Sun, Partial Shade, Indirect Light, Low Light).`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scientificName: { type: Type.STRING },
            waterFreqDays: { type: Type.INTEGER },
            lightNeed: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["scientificName", "waterFreqDays", "lightNeed"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("AI Identify by Name Error", e);
    throw e;
  }
};

// 2. Daily Tip (Advisor)
export const getDailyTip = async (weather: any, locationSummary: string) => {
  const ai = getAI();
  const prompt = `You are a gardening expert. The current weather is ${weather.temp}°C and condition code ${weather.conditionCode}. The user has plants in these environments: ${locationSummary}. Give ONE short, actionable gardening tip for today.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  
  return response.text;
};

// 3. Plant Doctor
export const diagnosePlant = async (imageBase64: string, userDescription: string) => {
  const ai = getAI();
  const prompt = `Act as a plant doctor. The user says: "${userDescription}". Analyze the image and the text. Provide a diagnosis title, a short explanation, and a recommended treatment.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
    },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                diagnosis: { type: Type.STRING },
                explanation: { type: Type.STRING },
                treatment: { type: Type.STRING }
            }
        }
    }
  });

  return JSON.parse(response.text || '{}');
};

// 4. Estimate Sunlight (Location Setup)
export const estimateSunlight = async (lat: number, lon: number, aspect: string) => {
   const ai = getAI();
   const prompt = `Estimate the typical direct sunlight hours per season for a location at Lat: ${lat}, Lon: ${lon} facing ${aspect}. Return approximate times (e.g. '09:00-14:00').`;
   
   const response = await ai.models.generateContent({
     model: 'gemini-2.5-flash',
     contents: prompt,
     config: {
         responseMimeType: "application/json",
         responseSchema: {
             type: Type.OBJECT,
             properties: {
                 spring: { type: Type.STRING },
                 summer: { type: Type.STRING },
                 autumn: { type: Type.STRING },
                 winter: { type: Type.STRING }
             }
         }
     }
   });
   
   return JSON.parse(response.text || '{}');
};