
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult, PredictionType } from "../types";

const API_KEY = process.env.API_KEY || "";

export const detectVoice = async (audioBase64: string): Promise<DetectionResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: audioBase64,
          },
        },
        {
          text: "Analyze this audio sample to determine if it is HUMAN or AI_GENERATED. Look for spectral consistency, pitch variance, and natural breathing artifacts. Return a JSON object with: prediction (HUMAN or AI_GENERATED), confidence (0.0 to 1.0), language_detected (Tamil, English, Hindi, Malayalam, or Telugu), and explanation (detailed reasoning for the prediction).",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prediction: { type: Type.STRING, enum: ["HUMAN", "AI_GENERATED"] },
          confidence: { type: Type.NUMBER },
          language_detected: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["prediction", "confidence", "language_detected", "explanation"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    prediction: result.prediction as PredictionType,
    confidence: result.confidence,
    language_detected: result.language_detected,
    explanation: result.explanation,
  };
};
