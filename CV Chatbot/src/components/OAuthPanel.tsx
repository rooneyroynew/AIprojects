import React, { useState } from "react";
import {
  X,
  Lock,
  Compass,
  FileText,
  Upload,
  Globe,
  Key,
  Paperclip,
  Check,
  Search,
  BookOpen,
} from "lucide-react";

interface OAuthPanelProps {
  onClose: () => void;
  onSetToken: (token: string) => void;
  onSetCVText: (text: string, fileName: string) => void;
  onSearchDrive: (token: string, searchExact: boolean) => Promise<void>;
  isLoading: boolean;
  token: string | null;
  errorMsg: string | null;
}

export default function OAuthPanel({
  onClose,
  onSetToken,
  onSetCVText,
  onSearchDrive,
  isLoading,
  token,
  errorMsg,
}: OAuthPanelProps) {
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem("gdrive_client_id") || "";
  });
  const [manualToken, setManualToken] = useState("");
  const [pastedCV, setPastedCV] = useState("");
  const [pastedCVTitle, setPastedCVTitle] = useState("Manual CV Text");
  const [activeTab, setActiveTab] = useState<"oauth" | "manual-token" | "paste-cv">("oauth");
  const [customClientOpen, setCustomClientOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  // Handle Client ID persistence
  const saveClientId = (id: string) => {
    setClientId(id);
    localStorage.setItem("gdrive_client_id", id);
  };

  // Run Google Implicit Flow Login redirect
  const handleGoogleLogin = () => {
    const targetClientId = clientId || "992861967093-mock-client-id.apps.googleusercontent.com"; // Fallback placeholder
    const redirectUri = window.location.origin;
    const scopes = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly";
    const responseType = "token";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      targetClientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
      scopes
    )}&response_type=${responseType}&prompt=select_account`;

    // Save ClientId if customized
    if (clientId) {
      localStorage.setItem("gdrive_client_id", clientId);
    }

    // Redirect or open popup
    window.location.href = authUrl;
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    onSetToken(manualToken.trim());
    setSearchStatus("Connecting and searching Drive...");
    try {
      await onSearchDrive(manualToken.trim(), true);
      setSearchStatus("Successfully authenticated! Loaded CV from Google Drive.");
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setSearchStatus(`Auth OK, but search failed: ${err.message || err}`);
    }
  };

  const handlePasteCVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedCV.trim()) return;
    onSetCVText(pastedCV.trim(), pastedCVTitle.trim() || "Copy-Pasted CV");
    onClose();
  };

  // Read local text/markdown files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onSetCVText(text, file.name);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Window Container */}
      <div className="relative w-full max-w-2xl bg-[--color-editorial-bg] border border-[--color-editorial-ink] shadow-2xl flex flex-col max-h-[90vh] z-10 animate-fade-in">
        {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[--color-editorial-border] bg-white">
            <div>
              <h2 className="text-xl font-serif italic text-[--color-editorial-ink] flex items-center">
                Select CV Connection Method
              </h2>
              <p className="text-[10px] text-[--color-editorial-accent] uppercase tracking-wider mt-1 font-mono">
                Load your CV from Google Docs, or use local fallbacks.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2 border border-[--color-editorial-ink] text-[--color-editorial-ink] hover:bg-neutral-100 transition-all font-mono text-xs uppercase"
            >
              Close
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[--color-editorial-border] text-xs font-mono uppercase tracking-wider bg-white">
            <button
              onClick={() => setActiveTab("oauth")}
              className={`flex-1 py-3 text-center border-b transition-all ${
                activeTab === "oauth"
                  ? "border-[--color-editorial-ink] text-[--color-editorial-ink] font-bold bg-[--color-editorial-card]"
                  : "border-transparent text-[--color-editorial-accent] hover:text-[--color-editorial-ink]"
              }`}
            >
              Sign-In Flow
            </button>
            <button
              onClick={() => setActiveTab("manual-token")}
              className={`flex-1 py-3 text-center border-b transition-all ${
                activeTab === "manual-token"
                  ? "border-[--color-editorial-ink] text-[--color-editorial-ink] font-bold bg-[--color-editorial-card]"
                  : "border-transparent text-[--color-editorial-accent] hover:text-[--color-editorial-ink]"
              }`}
            >
              Custom Token
            </button>
            <button
              onClick={() => setActiveTab("paste-cv")}
              className={`flex-1 py-3 text-center border-b transition-all ${
                activeTab === "paste-cv"
                  ? "border-[--color-editorial-ink] text-[--color-editorial-ink] font-bold bg-[--color-editorial-card]"
                  : "border-transparent text-[--color-editorial-accent] hover:text-[--color-editorial-ink]"
              }`}
            >
              Direct Paste
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-[--color-editorial-card]">
            {activeTab === "oauth" && (
              <div className="space-y-5">
                <div className="border border-[--color-editorial-border] bg-white p-4 text-xs leading-relaxed font-serif text-[--color-editorial-accent] italic">
                  We will search your Google Docs for the designated CV file:{" "}
                  <strong className="text-[--color-editorial-ink] font-sans font-bold">[CV_Randhir_Jha_Mar'26]</strong>. Once authenticated, the chatbot will
                  instantly read the document and feed it to the Gemini conversational
                  engine.
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center space-x-3 bg-white border border-[--color-editorial-ink] hover:bg-[--color-editorial-ink] hover:text-[--color-editorial-bg] py-3 px-4 rounded-none text-xs font-mono uppercase tracking-wider duration-200 transition-all cursor-pointer"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Authorize drive reading</span>
                  </button>

                  <button
                    onClick={() => setCustomClientOpen(!customClientOpen)}
                    className="text-[10px] text-[--color-editorial-accent] hover:text-[--color-editorial-ink] uppercase tracking-wider font-mono block mx-auto py-1"
                  >
                    {customClientOpen ? "[-] Hide" : "[+] Show"} Custom Host Client Settings
                  </button>

                  {customClientOpen && (
                    <div className="bg-white p-4 border border-[--color-editorial-border] space-y-3 animate-fade-in">
                      <div className="text-[11px] text-[--color-editorial-accent] leading-relaxed font-serif">
                        You can optionally specify your own registered Google Integration Client ID from your Google Cloud developer parameters:
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-mono text-[--color-editorial-ink] mb-1">
                          Google Client ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={clientId}
                          onChange={(e) => saveClientId(e.target.value)}
                          placeholder="99286196...apps.googleusercontent.com"
                          className="w-full text-xs border border-[--color-editorial-border] focus:border-[--color-editorial-ink] rounded-none p-2 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {token && (
                  <div className="border border-emerald-500 bg-emerald-50/25 p-3 flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center text-emerald-800">
                      <Check className="h-4 w-4 mr-1" />
                      Active Google Session
                    </span>
                    <button
                      onClick={() => onSetToken("")}
                      className="text-red-700 underline font-mono text-[10px] uppercase tracking-wider"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "manual-token" && (
              <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                <div className="border border-[--color-editorial-border] bg-white p-4 text-xs leading-relaxed font-serif text-[--color-editorial-accent] italic">
                  Paste an active Google API OAuth Access Token here. The token is never stored and is exclusively used in the browser to query public and shared Docs.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-mono text-[--color-editorial-ink] mb-1.5">
                      Bearer Access Token (ya29.*)
                    </label>
                    <textarea
                      required
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste your active Google OAuth Access Token here..."
                      rows={3}
                      className="w-full text-xs border border-[--color-editorial-border] focus:border-[--color-editorial-ink] rounded-none p-3 focus:outline-none font-mono bg-white"
                    />
                  </div>

                  {searchStatus && (
                    <div className="text-[11px] text-[--color-editorial-ink] bg-white p-2.5 border border-[--color-editorial-border] flex items-center space-x-2 animate-pulse font-mono">
                      <Search className="h-3.5 w-3.5" />
                      <span>{searchStatus}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[--color-editorial-ink] text-[--color-editorial-bg] hover:bg-neutral-800 py-3 px-4 rounded-none text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Validate Handshake Token
                  </button>
                </div>
              </form>
            )}

            {activeTab === "paste-cv" && (
              <div className="space-y-5">
                {/* File Upload Section */}
                <div>
                  <span className="editorial-section-label !mb-2">Local File Load</span>
                  <div className="border border-dashed border-[--color-editorial-border] bg-white p-6 text-center cursor-pointer hover:border-[--color-editorial-ink] transition-all relative">
                    <input
                      type="file"
                      accept=".txt,.md,.json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-[--color-editorial-accent] mx-auto mb-2" />
                    <p className="text-xs font-serif italic text-[--color-editorial-ink]">
                      Select or drop document file to scan
                    </p>
                    <p className="text-[9px] text-[--color-editorial-accent] font-mono uppercase tracking-wider mt-1">
                      Plaintext, markdown or JSON CV file
                    </p>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[--color-editorial-border]"></div>
                  <span className="flex-shrink mx-4 text-[9px] text-[--color-editorial-accent] uppercase font-mono tracking-widest">
                    Or Direct text paste
                  </span>
                  <div className="flex-grow border-t border-[--color-editorial-border]"></div>
                </div>

                {/* Paste Text Section */}
                <form onSubmit={handlePasteCVSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-mono text-[--color-editorial-ink] mb-1">
                        CV Candidate Reference Name
                      </label>
                      <input
                        type="text"
                        value={pastedCVTitle}
                        onChange={(e) => setPastedCVTitle(e.target.value)}
                        placeholder="Randhir Jha"
                        className="w-full text-xs border border-[--color-editorial-border] focus:border-[--color-editorial-ink] rounded-none p-2 focus:outline-none bg-white font-serif italic"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-mono text-[--color-editorial-ink] mb-1">
                        CV Markdown/Plaintext Content
                      </label>
                      <textarea
                        required
                        value={pastedCV}
                        onChange={(e) => setPastedCV(e.target.value)}
                        placeholder="Paste full CV work milestones, technologies, and achievements directly here..."
                        rows={6}
                        className="w-full text-xs border border-[--color-editorial-border] focus:border-[--color-editorial-ink] rounded-none p-3 focus:outline-none font-mono bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!pastedCV.trim()}
                    className="w-full bg-[--color-editorial-ink] disabled:bg-neutral-200 disabled:text-neutral-400 text-[--color-editorial-bg] py-3 px-4 rounded-none text-xs font-mono uppercase tracking-wide transition-all cursor-pointer"
                  >
                    Index Parsed Text
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
