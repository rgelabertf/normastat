import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Eres un experto científico en estadística y análisis de datos. 
Tu misión es ayudar al usuario a comprender conceptos clave sobre normalidad de datos, pruebas estadísticas y técnicas de estimación.
Mantén tus respuestas claras, educativas, precisas y científicamente rigurosas pero fáciles de entender en español de España/Latinoamérica.

Temas de interés clave sobre los que puedes educar al usuario de forma detallada:
1. POTENCIA estadística: Explica cómo se relaciona con la sensibilidad de la prueba para evitar falsos negativos (error tipo II). Especialmente en Shapiro-Francia/Shapiro-Wilk, y cómo el tamaño de la muestra afecta la potencia.
2. DISTANCIA empírica: Explica la distancia máxima vertical (estadístico D) en la prueba de Kolmogorov-Smirnov, comparando la función de distribución acumulada (CDF) empírica con la CDF teórica normal.
3. MOMENTOS de distribución: Explica la asimetría (skewness) y la curtosis (kurtosis), y cómo la prueba Jarque-Bera evalúa de forma conjunta la cercanía de estos momentos con los de una distribución normal teórica (sesgo = 0, exceso de curtosis = 0).
4. Estimación de Densidad por Kernel (KDE) Empírica: Explica cómo suaviza el histograma usando una función de kernel (como el gaussiano), y la gran importancia del parámetro de ancho de banda (bandwidth), incluyendo el optimizador robusto de Silverman.
5. Conceptos generales: Hipótesis nula (H0: los datos siguen una distribución normal), Hipótesis alternativa (H1: los datos no siguen una distribución normal), nivel de significancia (alfa), y cómo interpretar el valor-p (p-value).

Instrucciones de formato:
- Responde siempre de forma clara, educada, y profesional.
- Estructura las respuestas con viñetas, secciones en negrita y fórmulas estadísticas en formato LaTeX simple de ser relevante.
- Sé interactivo y ofréceles ejemplos claros para ilustrar tus explicaciones.`;

async function generateWithFallback(aiClient: GoogleGenAI, chatContents: any[], systemPrompt: string) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  const maxRetries = 2;
  let lastError: any = null;
  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: chatContents,
          config: { systemInstruction: systemPrompt, temperature: 0.7 },
        });
        if (response.text) return response.text;
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || "";
        const isTemporary =
          errMsg.includes("503") || errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") || errMsg.includes("overloaded") ||
          errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("exhausted") ||
          errMsg.includes("limit");
        if (isTemporary && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 600));
        } else break;
      }
    }
  }
  throw lastError || new Error("No se ha podido obtener respuesta de ningún modelo de Gemini.");
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function applyCors(res: any) {
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(name, value);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    applyCors(res);
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    applyCors(res);
    return res.status(405).json({ error: "Method not allowed" });
  }
  applyCors(res);
  try {
    const { contents } = req.body;
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "El cuerpo debe contener un array 'contents' válido." });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada. Configúrala en Vercel > Environment Variables." });
    }
    const ai = new GoogleGenAI({ apiKey });
    const replyText = await generateWithFallback(ai, contents, SYSTEM_INSTRUCTION);
    return res.json({ text: replyText });
  } catch (error: any) {
    let msg = error.message || "Error interno del servidor.";
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      msg = "El servicio de IA de Google está con alta demanda. Intenta de nuevo en unos segundos.";
    }
    return res.status(500).json({ error: msg });
  }
}
