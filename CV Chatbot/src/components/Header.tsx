import React, { useState } from "react";
import { FileText, Cpu, AlertCircle, RefreshCw, Key } from "lucide-react";

interface HeaderProps {
  apiKeyOk: boolean;
  onRefreshHealth: () => void;
  isHealthChecking: boolean;
  onOpenSettings: () => void;
  cvLoaded: boolean;
  cvFileName: string;
}

export default function Header({
  apiKeyOk,
  onRefreshHealth,
  isHealthChecking,
  onOpenSettings,
  cvLoaded,
  cvFileName,
}: HeaderProps) {
  return (
    <header className="border-b border-[--color-editorial-border] bg-[--color-editorial-bg] sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-4">
          
          {/* Editorial Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif italic text-[--color-editorial-ink] tracking-tight leading-none">
              Lexi CV Analysis
            </h1>
            <p className="text-[10px] text-[--color-editorial-accent] uppercase tracking-widest mt-1.5 font-mono">
              Intelligence Engine &amp; Chatbot
            </p>
          </div>

          {/* Doc Metadata State & Action Badges */}
          <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 text-xs">
            {cvLoaded ? (
              <div className="text-[11px] text-[--color-editorial-ink] font-serif italic animate-fade-in flex items-center gap-2">
                <span className="h-2 w-2 bg-[--color-editorial-ink] rounded-full"></span>
                <span>Document: {cvFileName}</span>
              </div>
            ) : (
              <div className="text-[11px] text-[--color-editorial-accent] italic flex items-center gap-2">
                <span className="h-2 w-2 bg-amber-600 rounded-full"></span>
                <span>No document loaded</span>
              </div>
            )}

            {/* Separator Pipe */}
            <span className="hidden md:inline text-[--color-editorial-border]">|</span>

            {/* Gemini API Status Badge */}
            <div className="flex items-center space-x-2">
              <div
                className={`py-1 px-2.5 text-[10px] font-mono tracking-wider uppercase border ${
                  apiKeyOk
                    ? "border-[--color-editorial-ink] text-[--color-editorial-ink]"
                    : "border-amber-500 text-amber-700 bg-amber-50/20"
                }`}
                title={apiKeyOk ? "Gemini Key Detected" : "Configure Secrets"}
              >
                {apiKeyOk ? "Gemini Active" : "Missing Key"}
              </div>
              <button
                onClick={onRefreshHealth}
                disabled={isHealthChecking}
                className="p-1 text-[--color-editorial-ink] hover:bg-neutral-100 rounded transition-all duration-200"
                title="Refresh Status Diagnostics"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isHealthChecking ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Editorial Trigger Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 border border-[--color-editorial-ink] hover:bg-[--color-editorial-ink] hover:text-[--color-editorial-bg] text-[--color-editorial-ink] text-xs font-mono uppercase tracking-wider py-1.5 px-4 transition-all"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Connect / Auth</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
