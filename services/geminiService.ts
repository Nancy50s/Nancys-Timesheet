import { GoogleGenAI, Type } from "@google/genai";
import { TimesheetData } from "../types";

// Initialize the Gemini API client
// Using a factory function to ensure we grab the latest key if environment changes, 
// though typically process.env is static.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const reviewTimesheet = async (data: TimesheetData) => {
  const ai = getAiClient();
  
  const prompt = `
    You are a strict but friendly payroll manager at "Nancy Mays 50's Cafe", a retro 1950s diner.
    Review the following timesheet data for errors or anomalies.
    
    Timesheet Data:
    ${JSON.stringify(data, null, 2)}

    Tasks:
    1. Check if the calculated totals (Reg Hours, Sales, Tips) look roughly consistent with the daily entries.
    2. If the hours are blank but In/Out times exist, calculate the total hours (assuming 24h or 12h format, handle AM/PM intelligently).
    3. Look for missing signatures or names.
    4. Provide a response in the persona of a 1950s diner manager (e.g., calling the user "sugar", "honey", referencing coffee or pie).

    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            managerComment: {
              type: Type.STRING,
              description: "The manager's feedback in character.",
            },
            detectedIssues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific issues found, if any.",
            },
            suggestedTotalHours: {
              type: Type.NUMBER,
              description: "Sum of hours calculated by AI based on In/Out times.",
            },
          },
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error reviewing timesheet:", error);
    throw error;
  }
};