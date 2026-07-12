import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Loader2, 
  HelpCircle, 
  Bot, 
  User,
  ChevronDown
} from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const PRESET_QUESTIONS = [
  {
    label: "Potencia (Shapiro-Francia)",
    text: "¿Qué significa la potencia estadística en la prueba de Shapiro-Francia y cómo se interpreta en mi muestra?"
  },
  {
    label: "Distancia (Kolmogorov-Smirnov)",
    text: "¿Qué representa la distancia empírica D en Kolmogorov-Smirnov y por qué es importante?"
  },
  {
    label: "Momentos (Jarque-Bera)",
    text: "¿Cómo evalúa la prueba Jarque-Bera la asimetría y curtosis de mis datos de manera conjunta?"
  },
  {
    label: "KDE Empírica y Bandwidth",
    text: "¿Qué es la estimación KDE empírica y qué papel juega el ancho de banda (bandwidth)?"
  },
  {
    label: "Interpretar p-valor",
    text: "¿Cómo debo tomar decisiones en base al p-valor si una prueba da normal y otra no normal?"
  }
];

export const AiChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "¡Hola! Soy tu asistente científico estadístico. Puedo ayudarte a aclarar cualquier concepto teórico sobre la normalidad de tus datos, potencia, distancias o el ajuste de curvas KDE. ¿De qué te gustaría hablar hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = { role: "user", text: textToSend };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Map ChatMessage structure to Gemini SDK expected parts format
      // { role: 'user' | 'model', parts: [{ text: string }] }
      const contentsPayload = updatedMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents: contentsPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se ha podido comunicar con el servidor.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ha ocurrido un problema al conectar con el asistente de IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleResetChat = () => {
    if (window.confirm("¿Seguro que deseas reiniciar la conversación con el asistente?")) {
      setMessages([
        {
          role: "model",
          text: "¡Hola de nuevo! He reiniciado nuestra sesión. Pregúntame lo que necesites sobre asimetría, curtosis, tests de normalidad, hipótesis u otros análisis estadísticos."
        }
      ]);
      setError(null);
    }
  };

  return (
    <div id="ai-chat-root" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="btn-open-ai-chat"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border border-blue-500/35"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">Consultar a la IA</span>
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div 
          id="ai-chat-window" 
          className="w-[380px] sm:w-[420px] h-[520px] bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-[#0D1117] dark:to-[#161B22] p-4 flex items-center justify-between border-b border-zinc-200 dark:border-[#30363D] text-white">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  Asistente Teórico IA
                  <span className="inline-block px-1.5 py-0.5 text-[8px] uppercase bg-emerald-500 text-white font-extrabold rounded-full">NormaStat</span>
                </h4>
                <p className="text-[10px] text-zinc-400 font-medium">Pregunta y aclara conceptos estadísticos</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-reset-ai-chat"
                onClick={handleResetChat}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 dark:hover:bg-[#30363D] transition-colors"
                title="Reiniciar chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                id="btn-close-ai-chat"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 dark:hover:bg-[#30363D] transition-colors"
                title="Minimizar chat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-[#0D1117]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                {/* Avatar icon */}
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border shadow-sm ${
                    msg.role === "user"
                      ? "bg-zinc-200 dark:bg-[#21262D] border-zinc-300 dark:border-[#30363D] text-zinc-700 dark:text-zinc-350"
                      : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                      : "bg-white dark:bg-[#161B22] text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/60 dark:border-[#30363D]/60 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* AI is thinking loader */}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 animate-spin">
                  <Loader2 className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-white dark:bg-[#161B22] text-zinc-500 dark:text-zinc-400 rounded-2xl rounded-tl-none border border-zinc-200/60 dark:border-[#30363D]/60 shadow-sm text-xs flex items-center gap-1.5">
                  <span>Procesando consulta con la IA...</span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-xl text-xs font-medium">
                <p>{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="p-3 bg-white dark:bg-[#161B22] border-t border-zinc-200 dark:border-[#30363D] overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-thin">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mr-1 pr-1.5 border-r border-zinc-200 dark:border-[#30363D] flex-shrink-0">
              <HelpCircle className="w-3 h-3" />
              <span>Sugerencias:</span>
            </div>
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q.text)}
                disabled={isLoading}
                className="inline-block px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#21262D] dark:hover:bg-[#30363D] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#30363D] rounded-full transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form 
            onSubmit={handleFormSubmit}
            className="p-3 bg-zinc-50 dark:bg-[#0D1117] border-t border-zinc-200 dark:border-[#30363D] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre asimetría, p-valores, KS..."
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-[#161B22] border border-zinc-300 dark:border-[#30363D] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none disabled:opacity-60"
            />
            <button
              id="btn-submit-ai-chat"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
