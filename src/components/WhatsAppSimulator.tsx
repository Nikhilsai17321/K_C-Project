import { useState, useRef, useEffect } from "react";
import { Send, Mic, Phone, Video, MoreVertical, ArrowLeft, Globe, CheckCheck, Loader2, Sparkles, TrendingUp, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, Transaction } from "../types";

interface WhatsAppSimulatorProps {
  onBack: () => void;
  onNavigateLender: () => void;
}

// Sample fast click messages for rural user simulation
const SAMPLE_MESSAGES = [
  { text: "Sold 45 liters milk to Dairy Union Co-op for ₹1800 today.", label: "🥛 Milk Sale (₹1,800)" },
  { text: "Bought cattle feed from Agro-Agency for ₹2500.", label: "🌾 Bought Feed (₹2,500)" },
  { text: "Daily Kirana counter sales reached ₹3800 today.", label: "🏪 Kirana Counter (₹3,800)" },
  { text: "Bought organic seeds from cooperative for ₹1200.", label: "🌱 Agro Seeds (₹1,200)" },
];

export default function WhatsAppSimulator({ onBack, onNavigateLender }: WhatsAppSimulatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "SYSTEM",
      text: "नमस्ते! Welcome to Kisan-Credit alternate Trust Builder. I am your AI Ledger Assistant. Log your daily sales or expenses here via text or voice memo to compute your score! 👍",
      timestamp: "9:40 AM"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState<"English" | "Hindi" | "Hinglish">("Hinglish");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real-time calculated demo scores
  const [simulatedTrustScore, setSimulatedTrustScore] = useState(55);
  const [recordedTransactions, setRecordedTransactions] = useState<Omit<Transaction, "id" | "applicantId">[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async (textToSend: string, isVoiceMemo = false) => {
    if (!textToSend.trim()) return;

    // Add user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "APPLICANT",
      text: textToSend,
      timestamp,
      isVoice: isVoiceMemo,
      duration: isVoiceMemo ? "0:08" : undefined,
      transcript: isVoiceMemo ? textToSend : undefined,
      status: "read"
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          language,
          isVoice: isVoiceMemo
        })
      });

      const data = await response.json();
      
      setIsLoading(false);

      // Add AI reply message
      const aiReplyMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "AI",
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parsedTransactions: data.transactions
      };

      setMessages((prev) => [...prev, aiReplyMsg]);

      // If transactions were parsed, add them to our simulator stats and update trust score!
      if (data.transactions && data.transactions.length > 0) {
        setRecordedTransactions((prev) => [...prev, ...data.transactions]);
        // Build trust score dynamically
        setSimulatedTrustScore((prev) => {
          let addition = 0;
          data.transactions.forEach((tx: any) => {
            if (tx.type === "INCOME") {
              addition += 4; // Income entries add positive credit rhythm
            } else {
              addition += 2; // Logging expenses shows high compliance
            }
          });
          const newScore = Math.min(prev + addition, 95);
          return newScore;
        });
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  // Simulating Voice Memo
  const startVoiceRecordingSim = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      // Simulate sending a voice transcript
      const transcripts = [
        "आज मैंने पैंतालीस लीटर दूध बेचा डेयरी संघ को और अट्ठारह सौ रुपये की कमाई हुई।",
        "Bought organic fertilizer and seeds today for twelve hundred rupees from block depot.",
        "Cattle veterinary check done. Paid Dr Sunil Rs 800 for boosters."
      ];
      const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
      handleSendMessage(randomTranscript, true);
    }, 2500);
  };

  // Dynamic calculations based on score
  const eligibleCreditLimit = Math.round((simulatedTrustScore - 40) * 1500);

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col md:flex-row">
      
      {/* Control Sidebar */}
      <div className="w-full md:w-96 bg-slate-950 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
        <div className="space-y-6">
          <button 
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display font-bold text-xl tracking-tight text-white">Applicant Sandbox</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test how a rural entrepreneur logs transactions on WhatsApp. Use the language switcher and try voice memos or quick presets to see real-time trust score updates.
            </p>
          </div>

          {/* Configuration */}
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                Select Preferred Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["English", "Hindi", "Hinglish"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`text-xs py-1.5 rounded-lg font-medium transition-all ${
                      language === lang 
                        ? "bg-emerald-600 text-white border-transparent"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Controls chatbot feedback language tone.</span>
            </div>

            {/* Micro-lending Eligibility Dashboard */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-500 font-bold">Dynamic Credit Builder</span>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Live Trust Score:</span>
                <span className="text-lg font-display font-bold text-emerald-400">{simulatedTrustScore} / 100</span>
              </div>

              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${simulatedTrustScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Eligible Credit Limit</span>
                  <span className="text-xl font-display font-bold text-white">
                    {eligibleCreditLimit > 0 ? `₹${eligibleCreditLimit.toLocaleString()}` : "Evaluating..."}
                  </span>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick-send Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Select simulated ledger logs:</span>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(preset.text)}
                  className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-xs transition-all flex items-center justify-between"
                  disabled={isLoading}
                >
                  <span className="text-slate-300 font-medium">{preset.label}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold font-mono">Send ➔</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA to check Lender Portal */}
        <div className="mt-8 pt-4 border-t border-slate-850">
          <button
            onClick={onNavigateLender}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Landmark className="w-4 h-4 text-emerald-500" />
            Check Lender Review Panel
          </button>
        </div>
      </div>

      {/* Main WhatsApp Simulator Interface */}
      <div className="flex-1 bg-slate-900/40 p-4 md:p-8 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-emerald-950),transparent_40%)]" />

        <div className="relative w-full max-w-sm rounded-[36px] border-8 border-slate-950 bg-[#efeae2] overflow-hidden flex flex-col shadow-2xl aspect-[9/16] max-h-[820px]">
          {/* iOS-Style status bar bar */}
          <div className="bg-slate-950 h-8 px-6 flex items-center justify-between text-white text-[11px] font-medium select-none z-10">
            <span>9:41 AM</span>
            <div className="w-20 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px]">KC AI-ASR Live</span>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-emerald-700 text-white px-3 py-2 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2">
              <button 
                onClick={onBack}
                className="p-1 hover:bg-white/10 rounded-full transition-colors md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-display font-bold text-sm relative">
                LD
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-700 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Lakshmi Devi</h3>
                <span className="text-[10px] opacity-90 block">Active • Trust Builder</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white/90">
              <Video className="w-4 h-4 hover:text-white cursor-pointer" />
              <Phone className="w-4 h-4 hover:text-white cursor-pointer" />
              <MoreVertical className="w-4 h-4 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* WhatsApp Chat Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
            style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundBlendMode: 'overlay', backgroundColor: '#e5ddd5' }}
          >
            <div className="self-center bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg shadow-sm text-[10px] text-center font-medium max-w-[90%] uppercase tracking-wider">
              🔒 Encrypted with AES-256 and verified by Kisan-Credit AI
            </div>

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ scale: 0.9, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-xs ${
                    msg.sender === "APPLICANT"
                      ? "bg-[#dcf8c6] text-slate-900 self-end rounded-tr-none ml-auto"
                      : "bg-white text-slate-800 self-start rounded-tl-none mr-auto"
                  }`}
                >
                  {/* Message body */}
                  <div className="space-y-2">
                    {msg.isVoice ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                          🎤
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-full" />
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 block">Voice note • {msg.duration || "0:08"}</span>
                        </div>
                      </div>
                    ) : null}

                    {msg.transcript ? (
                      <div className="border-l-2 border-emerald-500 pl-2 py-1 bg-slate-50 rounded">
                        <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Transcript Preview</span>
                        <p className="text-slate-600 italic">"{msg.transcript}"</p>
                      </div>
                    ) : (
                      <p className="font-medium leading-relaxed">{msg.text}</p>
                    )}

                    {/* Auto-parsed Transaction Card inside Chat */}
                    {msg.parsedTransactions && msg.parsedTransactions.length > 0 ? (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                          Auto-Parsed Transaction
                        </span>
                        
                        {msg.parsedTransactions.map((tx, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="block font-bold text-slate-850">{tx.description}</span>
                              <span className={`text-[8px] font-bold px-1 rounded uppercase tracking-wide inline-block mt-0.5 ${
                                tx.type === "INCOME" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                              }`}>
                                {tx.type}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block font-extrabold text-slate-900">₹{tx.amount}</span>
                              <span className="text-[8px] text-slate-400 font-mono">Conf: {Math.round(tx.confidenceScore * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Message Time */}
                  <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                    {msg.timestamp}
                    {msg.sender === "APPLICANT" && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-2.5 self-start rounded-tl-none mr-auto flex items-center gap-2 shadow-sm text-xs text-slate-500"
                >
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>Kisan AI parsing ledger entries...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Simulated WhatsApp Input Panel */}
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-200/50 flex items-center gap-2 z-10">
            <div className="flex-1 bg-white rounded-full border border-slate-200 shadow-inner px-3 py-1.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type daily entry..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-slate-800 text-xs placeholder-slate-400 h-6"
                disabled={isLoading}
              />
            </div>

            {inputText.trim() ? (
              <button
                onClick={() => handleSendMessage(inputText)}
                className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={startVoiceRecordingSim}
                className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md flex-shrink-0 ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
                disabled={isLoading}
              >
                {isRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
