import React, { useState, useRef, useEffect } from "react";
import { Message, CVContent } from "../types";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, Sparkles, SendHorizontal, Trash2, ArrowDown } from "lucide-react";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isSending: boolean;
  cv: CVContent | null;
  onClearSession: () => void;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isSending,
  cv,
  onClearSession,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested conversational starter queries
  const starters = [
    { label: "Executive Summary", prompt: "Provide a comprehensive structured summary of Randhir's CV, highlighting key career paths and achievements." },
    { label: "Technical Competencies", prompt: "Identify and list all core technical skills and expertise present in Randhir's resume." },
    { label: "Verify Placement Potential", prompt: "Suggest what types of engineering, development, or tech lead positions Randhir is highly qualified for based on his work tenure." },
    { label: "Interview Simulation", prompt: "Acting as an interviewer, generate 5 technical and behavioral interview questions tailored to Randhir's experience." },
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleChipClick = (promptText: string) => {
    if (isSending) return;
    onSendMessage(promptText);
  };

  return (
    <div className="bg-[--color-editorial-card] border border-[--color-editorial-border] flex flex-col h-[600px] overflow-hidden">
      {/* Bot Chat Header */}
      <div className="px-6 py-4 border-b border-[--color-editorial-border] bg-white flex justify-between items-center text-xs font-sans">
        <div className="flex items-center space-x-2">
          <div className="border border-[--color-editorial-ink] p-1">
            <Bot className="h-4 w-4 text-[--color-editorial-ink]" />
          </div>
          <div>
            <span className="font-bold text-[--color-editorial-ink] block font-mono uppercase tracking-wider text-[11px]">Chat Consultation</span>
            <span className="text-[9px] text-[--color-editorial-accent] font-mono uppercase tracking-widest">Gemini Engine Online</span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearSession}
            className="flex items-center space-x-1 text-red-700 hover:bg-red-50 border border-red-200 py-1 px-2.5 transition-all text-[11px] font-mono uppercase tracking-wider bg-white"
            title="Reset Chat Session"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear Dialogue</span>
          </button>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[--color-editorial-bg]" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3 font-sans">
            <div className="border border-[--color-editorial-border] p-3 rounded-full bg-white">
              <Bot className="h-8 w-8 text-[--color-editorial-ink]/70" />
            </div>
            <div>
              <h4 className="text-base font-serif italic text-[--color-editorial-ink]">Dialogue Interface</h4>
              <p className="text-xs text-[--color-editorial-accent] mt-1.5 leading-relaxed font-sans">
                {cv
                  ? "Randhir's records are authenticated. Pose any inquiry: map his expertise to a job description, inspect past metrics, or write a bespoke introductory cover letter."
                  : "Please index a credential document using the authentication portal, or input fallback text to engage the chat agent."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                >
                  {/* Sender Metadata Block */}
                  <div className="flex items-center space-x-1.5 text-[9px] font-mono uppercase tracking-widest text-[--color-editorial-accent]">
                    <span>{isUser ? "Inquirer" : "Analysis Bot"}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[90%] p-4 border font-serif text-sm leading-relaxed transition-all ${
                      isUser
                        ? "bg-white border-[--color-editorial-ink]/45 text-[--color-editorial-ink] italic"
                        : "bg-[--color-editorial-card] border-[--color-editorial-border] text-[--color-editorial-ink]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-line">{msg.content}</p>
                    ) : (
                      <div className="markdown-body space-y-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex flex-col items-start space-y-1 animate-pulse">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[--color-editorial-accent]">
                  Analysis Bot • Drafting Report
                </div>
                <div className="bg-[--color-editorial-card] border border-[--color-editorial-border] p-4 text-xs font-serif italic text-[--color-editorial-accent] flex items-center space-x-2">
                  <span className="flex space-x-1">
                    <span className="h-1.5 w-1.5 bg-[--color-editorial-ink] rounded-full animate-bounce delay-100"></span>
                    <span className="h-1.5 w-1.5 bg-[--color-editorial-ink] rounded-full animate-bounce delay-200"></span>
                    <span className="h-1.5 w-1.5 bg-[--color-editorial-ink] rounded-full animate-bounce delay-300"></span>
                  </span>
                  <span>Reviewing CV sections...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestion Starter Chips */}
      {cv && messages.length === 0 && (
        <div className="px-6 py-4 border-t border-[--color-editorial-border] bg-white">
          <p className="editorial-section-label !mb-2.5">
            Suggested Consultations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starters.map((starter, ind) => (
              <button
                key={ind}
                onClick={() => handleChipClick(starter.prompt)}
                disabled={isSending}
                className="text-[11px] font-serif italic px-3 py-2 border border-[--color-editorial-border] hover:border-[--color-editorial-ink] bg-white text-[--color-editorial-ink] transition-all text-left cursor-pointer"
              >
                {starter.label} &rarr;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Tray */}
      <div className="p-4 border-t border-[--color-editorial-border] bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!cv || isSending}
            placeholder={
              cv ? "Submit cv query or job alignment criteria..." : "Index a CV to initialize conversation"
            }
            className="flex-1 bg-[--color-editorial-bg] text-xs border border-[--color-editorial-border] focus:border-[--color-editorial-ink] rounded-none px-4 py-3 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-sans text-[--color-editorial-ink]"
          />
          <button
            type="submit"
            disabled={!cv || isSending || !input.trim()}
            className="bg-[--color-editorial-ink] hover:bg-neutral-800 text-[--color-editorial-bg] rounded-none px-5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
