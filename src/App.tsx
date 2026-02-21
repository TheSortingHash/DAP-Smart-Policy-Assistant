import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendMessageStream, ChatMessage } from "./services/gemini";

export default function App() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      setHistory((prev) => [...prev, { role: "model", text: "" }]);
      const stream = await sendMessageStream(userMessage, history);

      let fullResponse = "";
      for await (const chunk of stream) {
        if (chunk) {
          fullResponse += chunk;
          setHistory((prev) => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = fullResponse;
            return newHistory;
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text =
          "An error occurred while processing your request. Please try again.";
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              DAP Policy Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Ask me anything about the 2025 internal policies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>Policies Embedded</span>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                How can I help you today?
              </h2>
              <p className="text-slate-500">
                I am pre-loaded with the 2025 Memorandum Circulars, Office Orders, and Special Orders. Ask me a question to get started.
              </p>
            </div>
          ) : (
            history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 max-w-3xl mx-auto ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}
                >
                  <div
                    className={`inline-block text-left ${
                      msg.role === "user"
                        ? "bg-slate-100 text-slate-800 px-5 py-3 rounded-2xl rounded-tr-sm"
                        : "prose prose-slate max-w-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap m-0">{msg.text}</p>
                    ) : msg.text ? (
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2"
            >
              <div className="relative flex-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask about the policies..."
                  disabled={isLoading}
                  className="w-full max-h-32 min-h-[56px] bg-transparent border-0 focus:ring-0 resize-none py-4 pl-4 pr-12 text-slate-800 placeholder:text-slate-400 disabled:opacity-50 outline-none"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-[56px] px-6 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <div className="text-center mt-3">
              <p className="text-xs text-slate-400">
                Press Enter to send, Shift + Enter for new line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
