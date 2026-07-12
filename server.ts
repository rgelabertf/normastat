import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Endpoint for chat clarification
app.post("/api/chat", async (req, res) => {
  try {
    const { contents } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "El cuerpo de la petición debe contener un array 'contents' válido." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "La clave API de Gemini (GEMINI_API_KEY) no está configurada. Por favor, añádela en la pestaña de Configuración > Secretos en AI Studio." 
      });
    }

    // Lazy initialization of GoogleGenAI to prevent startup crash if API key is not yet set.
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Helper function to handle exponential backoff and try multiple model fallback options (e.g. gemini-3.5-flash and gemini-3.1-flash-lite)
    const generateWithFallback = async (aiClient: GoogleGenAI, chatContents: any[], systemPrompt: string) => {
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
      const maxRetries = 2; // Number of retries per model

      let lastError: any = null;

      for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Intentando generación con modelo ${modelName} (Intento ${attempt + 1}/${maxRetries + 1})...`);
            const response = await aiClient.models.generateContent({
              model: modelName,
              contents: chatContents,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
              },
            });
            
            if (response.text) {
              console.log(`Generación exitosa con el modelo ${modelName}.`);
              return response.text;
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err.message || "";
            console.warn(`Error al usar el modelo ${modelName} en el intento ${attempt + 1}:`, errMsg);
            
            // Check if error is related to temporary high demand or rate limits (503, UNAVAILABLE, overload, resource_exhausted)
            const isTemporaryError = 
              errMsg.includes("503") || 
              errMsg.includes("UNAVAILABLE") || 
              errMsg.includes("high demand") || 
              errMsg.includes("overloaded") ||
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.includes("exhausted") ||
              errMsg.includes("limit");

            if (isTemporaryError && attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 600; // 600ms, 1200ms
              console.log(`El servicio experimenta una alta demanda temporal. Reintentando en ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              // Not a temporary network/load error, or exhausted retries for this model. Try next model.
              break;
            }
          }
        }
      }

      throw lastError || new Error("No se ha podido obtener respuesta de ningún modelo de Gemini tras varios intentos.");
    };

    const replyText = await generateWithFallback(ai, contents, SYSTEM_INSTRUCTION);
    return res.json({ text: replyText });
  } catch (error: any) {
    console.error("Error en /api/chat:", error);
    
    // Provide a user-friendly custom message if it's still a 503 after all retries and fallback
    let friendlyMessage = error.message || "Error interno del servidor al procesar la petición con Gemini.";
    if (friendlyMessage.includes("503") || friendlyMessage.includes("UNAVAILABLE") || friendlyMessage.includes("high demand")) {
      friendlyMessage = "El servicio de IA de Google está experimentando una demanda inusualmente alta en este momento. Por favor, realiza tu pregunta de nuevo en unos segundos.";
    }

    return res.status(500).json({ error: friendlyMessage });
  }
});

// Configure Vite middleware / Static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando servidor en modo DESARROLLO (Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando servidor en modo PRODUCCIÓN (Static dist)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
  });
}

setupServer();
