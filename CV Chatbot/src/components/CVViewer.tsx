import React, { useState } from "react";
import { CVContent } from "../types";
import {
  FileText,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  FileSearch,
} from "lucide-react";

interface CVViewerProps {
  cv: CVContent | null;
  onOpenAuth: () => void;
  isExtracting: boolean;
  onAskQuestion: (q: string) => void;
}

export default function CVViewer({ cv, onOpenAuth, isExtracting, onAskQuestion }: CVViewerProps) {
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");

  if (isExtracting) {
    return (
      <div className="bg-[--color-editorial-card] border border-[--color-editorial-border] p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 border border-[--color-editorial-ink] border-t-transparent rounded-full animate-spin"></div>
          <FileText className="h-5 w-5 text-[--color-editorial-ink] absolute animate-pulse" />
        </div>
        <h3 className="text-base font-serif italic text-[--color-editorial-ink] mt-4 text-center">
          Digitizing &amp; Extracting CV Details
        </h3>
        <p className="text-xs text-[--color-editorial-accent] text-center mt-1.5 font-sans max-w-xs leading-relaxed">
          Retrieving document from Google Drive. Gemini is parsing standard key sections for an elite chatbot review.
        </p>
      </div>
    );
  }

  // If no CV is loaded, render the elegant editorial style landing card
  if (!cv) {
    return (
      <div className="bg-[--color-editorial-card] border border-[--color-editorial-border] p-8 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="border border-[--color-editorial-ink] p-3 rounded-full mb-4">
          <FileSearch className="h-8 w-8 text-[--color-editorial-ink]" />
        </div>
        
        <h2 className="text-2xl font-serif italic text-[--color-editorial-ink] tracking-tight">
          Parchment Not Found
        </h2>
        
        <p className="text-xs text-[--color-editorial-accent] font-sans max-w-sm mt-3 leading-relaxed">
          To initiate analysis, authorize this agent to index your Google Doc titled <strong>[CV_Randhir_Jha_Mar&#39;26]</strong> in your connected Drive, or supply fallback resume text.
        </p>

        <button
          onClick={onOpenAuth}
          className="mt-6 border border-[--color-editorial-ink] hover:bg-[--color-editorial-ink] hover:text-[--color-editorial-bg] text-[--color-editorial-ink] font-mono text-xs uppercase tracking-wider py-2 px-6 transition-all duration-150"
        >
          Fetch Document Now
        </button>

        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-xs text-left font-sans">
          <div className="border-t border-[--color-editorial-border] pt-2.5">
            <span className="editorial-section-label !mb-0.5">Step 1</span>
            <p className="text-[11px] font-medium text-[--color-editorial-ink]">
              OAuth Consent Setup
            </p>
          </div>
          <div className="border-t border-[--color-editorial-border] pt-2.5">
            <span className="editorial-section-label !mb-0.5">Step 2</span>
            <p className="text-[11px] font-medium text-[--color-editorial-ink]">
              Structured Analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { parsedData, rawText, fileName } = cv;

  return (
    <div className="bg-[--color-editorial-card] border border-[--color-editorial-border] flex flex-col min-h-[500px] overflow-hidden">
      {/* Editorial Tab Bar */}
      <div className="flex border-b border-[--color-editorial-border] px-4 py-2 justify-between items-center text-xs">
        <div className="flex space-x-1.5">
          <button
            onClick={() => setActiveTab("formatted")}
            className={`py-1 px-3 text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === "formatted"
                ? "border border-[--color-editorial-ink] text-[--color-editorial-ink] bg-white font-semibold"
                : "text-[--color-editorial-accent] hover:text-[--color-editorial-ink]"
            }`}
          >
            Structured profile
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`py-1 px-3 text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === "raw"
                ? "border border-[--color-editorial-ink] text-[--color-editorial-ink] bg-white font-semibold"
                : "text-[--color-editorial-accent] hover:text-[--color-editorial-ink]"
            }`}
          >
            Raw Print Text
          </button>
        </div>

        <span className="text-[10px] text-[--color-editorial-accent] font-mono uppercase tracking-widest hidden sm:inline-block">
          SOURCE: {fileName}
        </span>
      </div>

      {/* Structured / Formatted Resume */}
      {activeTab === "formatted" && (
        <div className="p-6 sm:p-8 flex-1 space-y-6 overflow-y-auto max-h-[620px] scrollbar-thin">
          {/* Resume Header Area */}
          <div className="border-b border-[--color-editorial-border] pb-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
              <div>
                <h3 className="text-2xl font-serif text-[--color-editorial-ink] tracking-tight">
                  {parsedData?.fullName || "Candidate Resume Profile"}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-[--color-editorial-accent] align-center font-mono">
                  {parsedData?.email && (
                    <span className="flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1 text-[--color-editorial-ink]" />
                      {parsedData.email}
                    </span>
                  )}
                  {parsedData?.phone && (
                    <span className="flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1 text-[--color-editorial-ink]" />
                      {parsedData.phone}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-[--color-editorial-ink] border border-[--color-editorial-ink] uppercase tracking-wider font-mono px-2 py-0.5 mt-2 sm:mt-0 inline-block">
                FULLY INDEXED
              </span>
            </div>

            {/* Resume Summary */}
            {parsedData?.summary && (
              <div className="mt-4">
                <p className="text-sm text-[--color-editorial-accent] font-serif leading-relaxed italic border-l border-[--color-editorial-ink] pl-3">
                  “ {parsedData.summary} ”
                </p>
              </div>
            )}
          </div>

          {/* Core Skills Segment */}
          {parsedData?.skills && parsedData.skills.length > 0 && (
            <div className="space-y-2">
              <span className="editorial-section-label">Core Competencies</span>
              <div className="flex flex-wrap gap-1">
                {parsedData.skills.map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => onAskQuestion(`What specific project achievements does Randhir have with ${skill}?`)}
                    className="border border-[--color-editorial-border] hover:border-[--color-editorial-ink] bg-white text-[--color-editorial-ink] px-2.5 py-1 text-xs rounded-full transition-all duration-150 text-left cursor-pointer font-serif italic"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Work Experiences */}
          {parsedData?.experience && parsedData.experience.length > 0 && (
            <div className="space-y-4">
              <span className="editorial-section-label">Professional Work History</span>
              <div className="relative border-l border-[--color-editorial-border] pl-4 space-y-5 ml-1 font-sans">
                {parsedData.experience.map((exp, index) => (
                  <div key={index} className="relative group">
                    <span className="absolute -left-[20.5px] top-1.5 h-2 w-2 rounded-full bg-[--color-editorial-ink] ring-4 ring-[--color-editorial-card]"></span>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1">
                      <div>
                        <h5 className="text-sm font-bold text-[--color-editorial-ink] group-hover:underline transition-all">
                          {exp.role}
                        </h5>
                        <p className="text-xs text-[--color-editorial-accent] font-serif italic">{exp.company}</p>
                      </div>
                      {exp.duration && (
                        <span className="text-[10px] text-[--color-editorial-accent] font-mono uppercase tracking-wider mt-0.5 font-medium">
                          {exp.duration}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-[--color-editorial-accent] font-serif mt-1.5 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational Credentials */}
          {parsedData?.education && parsedData.education.length > 0 && (
            <div className="space-y-3">
              <span className="editorial-section-label">Education Landmarks</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {parsedData.education.map((edu, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border border-[--color-editorial-border] flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-[--color-editorial-ink]">{edu.degree}</h5>
                      <p className="text-[11px] text-[--color-editorial-accent] font-serif italic">{edu.institution}</p>
                    </div>
                    {edu.year && (
                      <span className="text-[9px] text-[--color-editorial-accent] mt-2 font-mono">{edu.year}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw Parser Text view */}
      {activeTab === "raw" && (
        <div className="p-6 flex-1 flex flex-col overflow-hidden max-h-[620px]">
          <div className="bg-neutral-900 text-gray-200 font-mono text-xs p-4 rounded-none flex-1 overflow-y-auto leading-relaxed scrollbar-thin max-h-[550px] select-all whitespace-pre-wrap">
            {rawText}
          </div>
          <div className="text-[10px] text-[--color-editorial-accent] mt-2 font-mono uppercase tracking-widest text-right">
            Ctrl+A inside box to capture direct plaintext
          </div>
        </div>
      )}
    </div>
  );
}
