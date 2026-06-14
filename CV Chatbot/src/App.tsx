import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import OAuthPanel from "./components/OAuthPanel";
import CVViewer from "./components/CVViewer";
import ChatPanel from "./components/ChatPanel";
import { Message, CVContent } from "./types";
import { Info, HelpCircle, FileText, AlertCircle } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("gdrive_access_token") || null;
  });
  const [cv, setCV] = useState<CVContent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [apiKeyOk, setApiKeyOk] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [chatId, setChatId] = useState<string>(() => Math.random().toString(36).substring(7));

  // Check backend service key diagnostics
  const checkServiceHealth = async () => {
    setIsHealthChecking(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setApiKeyOk(!!data.hasGeminiKey);
      } else {
        setApiKeyOk(false);
      }
    } catch {
      setApiKeyOk(false);
    } finally {
      setIsHealthChecking(false);
    }
  };

  useEffect(() => {
    checkServiceHealth();
  }, []);

  // Capture redirected Google Implicit OAuth Hash Access Token on redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        setToken(accessToken);
        sessionStorage.setItem("gdrive_access_token", accessToken);
        window.location.hash = ""; // Clear for protection and aesthetic
        showToast("success", "Connected with Google Account! Searching for CV doc...");
        handleSearchDriveAndLoad(accessToken, true);
      }
    }
  }, []);

  // Toast notifier
  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSetToken = (newToken: string) => {
    setToken(newToken);
    if (newToken) {
      sessionStorage.setItem("gdrive_access_token", newToken);
    } else {
      sessionStorage.removeItem("gdrive_access_token");
      setCV(null);
      setMessages([]);
    }
  };

  const handleSetCVText = async (text: string, fileName: string) => {
    setIsExtracting(true);
    setChatId(Math.random().toString(36).substring(7));
    showToast("info", `Parsing and structuring CV: "${fileName}" using Gemini API...`);
    try {
      const res = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse structured details");
      }

      const parsedData = await res.json();
      setCV({
        rawText: text,
        fileName,
        parsedData,
      });

      // Insert introductory greetings assistant message
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: `Hello! I've loaded and parsed **${parsedData?.fullName || fileName}**'s professional CV profiles. 

Here is what I'm ready to answer:
- Core tech stacks, frameworks, and expert domains.
- Career path timeline & milestone deliverables.
- Evaluating suitabilities or custom matching against any **Job Descriptions** you paste!
- Designing custom, resume-tailored practice interview questions.

What would you like to discuss first?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      showToast("success", "Structured CV parsed successfully!");
    } catch (err: any) {
      console.error(err);
      // Fallback to storing raw text only
      setCV({
        rawText: text,
        fileName,
      });
      setMessages([
        {
          id: "welcome-fallback",
          role: "model",
          content: `Hi there! I've loaded your raw CV text: **${fileName}**. While our structured layout parsing had issues, I am still 100% ready to answer any questions about the resume text! Ask away!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      showToast("error", `Parsing failed, loaded raw text instead: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Connect to Google Drive REST API to search for target docs
  const handleSearchDriveAndLoad = async (accessToken: string, searchExact: boolean) => {
    setIsExtracting(true);
    try {
      // 1. Search for docs matching exact or contains name [CV_Randhir_Jha_Mar'26]
      const searchQuery = "name contains 'CV_Randhir_Jha_Mar\'26'";
      const fields = "files(id, name, mimeType)";
      const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        searchQuery
      )}&fields=${encodeURIComponent(fields)}`;

      const res = await fetch(driveUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error("Unable to read Google Drive metadata. Token might be expired.");
      }

      const data = await res.json();
      const files = data.files || [];

      if (files.length === 0) {
        // If not found, list general files to let them find sheets/docs
        showToast("info", "CV file titled [CV_Randhir_Jha_Mar'26] not found. Please paste CV or use custom files.");
        setIsExtracting(false);
        setSettingsOpen(true);
        return;
      }

      // Search for Google Doc file format first
      const gdocFile = files.find(
        (f: any) => f.mimeType === "application/vnd.google-apps.document"
      );

      const targetFile = gdocFile || files[0];

      if (targetFile.mimeType === "application/vnd.google-apps.document") {
        // 2. Fetch Google Doc paragraph nodes
        const docRes = await fetch(
          `https://docs.googleapis.com/v1/documents/${targetFile.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!docRes.ok) {
          throw new Error("Found the document, but failed to fetch body node text.");
        }

        const docData = await docRes.json();
        // Parse doc body block
        let extractedText = "";
        if (docData?.body?.content) {
          for (const element of docData.body.content) {
            if (element.paragraph?.elements) {
              for (const part of element.paragraph.elements) {
                if (part.textRun?.content) {
                  extractedText += part.textRun.content;
                }
              }
            } else if (element.table?.tableRows) {
              for (const row of element.table.tableRows) {
                if (row.tableCells) {
                  for (const cell of row.tableCells) {
                    if (cell.content) {
                      for (const cellItem of cell.content) {
                        if (cellItem.paragraph?.elements) {
                          for (const part of cellItem.paragraph.elements) {
                            if (part.textRun?.content) {
                              extractedText += part.textRun.content + " ";
                            }
                          }
                        }
                      }
                    }
                  }
                }
                extractedText += "\n";
              }
            }
          }
        }

        if (!extractedText.trim()) {
          throw new Error("The retrieved Google Doc appears to be completely empty.");
        }

        await handleSetCVText(extractedText, targetFile.name);
      } else {
        // We found a non-gdoc (PDF/Word/txt)
        showToast(
          "info",
          `Found file "${targetFile.name}", but it is not a Google Doc. Downloading text fallback...`
        );
        // Let's attempt to download it textually or suggest converting
        const fileRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${targetFile.id}?alt=media`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (fileRes.ok) {
          const rawDocText = await fileRes.text();
          if (rawDocText && rawDocText.length > 20) {
            await handleSetCVText(rawDocText, targetFile.name);
          } else {
            throw new Error("Format is binary. Please convert to a Google Doc in Drive.");
          }
        } else {
          throw new Error(
            "Target file is PDF/Word format. Please convert it to a standard Google Doc in Drive."
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "An error occurred during Google Drive import.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isSending) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          cvText: cv?.rawText,
          chatId: chatId,
          history: updatedMessages.slice(-12), // Keep up to 12 messages of conversational context limit
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get chatbot reply from Gemini service");
      }

      const data = await res.json();
      const replyMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "model",
        content: data.reply || "I didn't receive a valid answer from the model.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, replyMsg]);
    } catch (err: any) {
      showToast("error", err?.message || "An error occurred while calling the chatbot.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClearSession = () => {
    setMessages([]);
    setChatId(Math.random().toString(36).substring(7));
    showToast("info", "Chat logs reset!");
  };

  return (
    <div className="min-h-screen bg-[--color-editorial-bg] flex flex-col font-sans pb-16">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-24 right-4 z-50 max-w-sm w-full bg-white border border-[--color-editorial-ink] p-4 animate-slide-in flex items-start space-x-3 rounded-none">
          <div
            className={`p-1 ${
              toast.type === "success"
                ? "text-emerald-700"
                : toast.type === "error"
                ? "text-red-700"
                : "text-[--color-editorial-ink]"
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-mono tracking-wider uppercase text-[--color-editorial-ink] font-bold">
              Dispatch Notification
            </p>
            <p className="text-xs text-[--color-editorial-accent] mt-1 font-serif italic leading-normal">{toast.text}</p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        apiKeyOk={apiKeyOk}
        onRefreshHealth={checkServiceHealth}
        isHealthChecking={isHealthChecking}
        onOpenSettings={() => setSettingsOpen(true)}
        cvLoaded={!!cv}
        cvFileName={cv?.fileName || ""}
      />

      {/* Main Dynamic Panel Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Extracted CV viewer (takes 5/12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <CVViewer
              cv={cv}
              onOpenAuth={() => setSettingsOpen(true)}
              isExtracting={isExtracting}
              onAskQuestion={handleSendMessage}
            />
          </div>

          {/* Right panel: Conversational Chatbot (takes 7/12 cols) */}
          <div className="lg:col-span-7">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              cv={cv}
              onClearSession={handleClearSession}
            />
          </div>
        </div>
      </main>

      {/* Settings / Google OAuth Setup Drawer-Modal */}
      {settingsOpen && (
        <OAuthPanel
          onClose={() => setSettingsOpen(false)}
          onSetToken={handleSetToken}
          onSetCVText={handleSetCVText}
          onSearchDrive={handleSearchDriveAndLoad}
          isLoading={isExtracting}
          token={token}
          errorMsg={null}
        />
      )}
    </div>
  );
}
