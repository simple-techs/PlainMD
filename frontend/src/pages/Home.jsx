import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, GitCompare, TrendingUp, HelpCircle, ChevronRight, FileText, Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import AppShell from "../components/AppShell";

const quickActions = [
  { key: "explain", label: "Explain this", icon: Sparkles, prompt: "Can you explain this document in simpler terms?" },
  { key: "compare", label: "Compare labs", icon: GitCompare, prompt: "Compare this to my previous lab results" },
  { key: "trends", label: "Show trends", icon: TrendingUp, prompt: "Show me trends in my health records over time" },
  { key: "normal", label: "What's normal?", icon: HelpCircle, prompt: "Are these results within normal range?" },
];

const categoryColors = {
  labs: "bg-green-100 text-green-600",
  imaging: "bg-blue-100 text-blue-600",
  medications: "bg-red-100 text-red-600",
  prescriptions: "bg-orange-100 text-orange-600",
  diagnoses: "bg-purple-100 text-purple-600",
  visits: "bg-teal-100 text-teal-600",
  procedures: "bg-yellow-100 text-yellow-600",
  allergies: "bg-pink-100 text-pink-600",
  uncategorized: "bg-zinc-100 text-zinc-600",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [convRes, docsRes] = await Promise.all([
          api.get("/conversations"),
          api.get("/documents"),
        ]);
        setConversations(convRes.data.conversations?.slice(0, 3) || []);
        setDocuments(docsRes.data.documents?.slice(0, 3) || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChat = async (message) => {
    if (!message.trim()) return;
    try {
      const { data } = await api.post("/chat", { message });
      navigate(`/app/chat/${data.conversation_id}`);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate("/register");
      }
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    handleChat(chatInput);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="hidden lg:flex justify-end mb-2">
          <button className="p-2 rounded-xl hover:bg-zinc-100 transition-colors">
            <Bell size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Ask anything about your health records.</p>
        </div>

        <form onSubmit={handleChatSubmit} className="mb-8">
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-brand-purple/20 focus-within:border-brand-purple transition-all">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question about your health..."
              className="flex-1 text-sm outline-none bg-transparent placeholder-zinc-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-10 h-10 rounded-full bg-brand-purple text-white flex items-center justify-center hover:bg-brand-purple-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {quickActions.map(({ key, label, icon: Icon, prompt }) => (
            <button
              key={key}
              onClick={() => handleChat(prompt)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-zinc-200/80 hover:border-brand-purple/30 hover:bg-brand-lavender/20 transition-all text-center group"
            >
              <Icon size={22} className="text-zinc-400 group-hover:text-brand-purple transition-colors" />
              <span className="text-xs font-medium text-zinc-600 group-hover:text-brand-purple transition-colors">{label}</span>
            </button>
          ))}
        </div>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Recent Conversations</h2>
            <button onClick={() => navigate("/app/conversations")} className="text-xs font-medium text-brand-purple hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200/80 p-4 animate-pulse">
                  <div className="h-4 bg-zinc-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 text-center">
              <p className="text-sm text-zinc-400">No conversations yet. Upload a document or ask a question to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => navigate(`/app/chat/${conv.conversation_id}`)}
                  className="w-full flex items-center justify-between bg-white rounded-2xl border border-zinc-200/80 p-4 hover:border-brand-purple/20 hover:bg-brand-warm-white transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-lavender flex items-center justify-center shrink-0">
                      <Sparkles size={16} className="text-brand-purple" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{conv.title}</p>
                      <p className="text-xs text-zinc-400">{formatDate(conv.updated_at)}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-brand-purple transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Recent Documents</h2>
            <button onClick={() => navigate("/app/documents")} className="text-xs font-medium text-brand-purple hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200/80 p-4 animate-pulse">
                  <div className="h-4 bg-zinc-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 text-center">
              <p className="text-sm text-zinc-400">No documents uploaded yet. Upload your first medical record to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.document_id}
                  onClick={() => navigate("/app/documents")}
                  className="w-full flex items-center justify-between bg-white rounded-2xl border border-zinc-200/80 p-4 hover:border-brand-purple/20 hover:bg-brand-warm-white transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[doc.category] || categoryColors.uncategorized}`}>
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{doc.filename}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(doc.uploaded_at)}
                        {doc.category && doc.category !== "uncategorized" && (
                          <span> &middot; {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {user?.is_guest && (
          <div className="bg-brand-lavender/50 border border-brand-purple/20 rounded-2xl p-4 text-center">
            <p className="text-sm text-zinc-700 mb-2">
              You're using PlainMD as a guest. Create an account to unlock unlimited uploads and conversations.
            </p>
            <button onClick={() => navigate("/register")} className="text-sm font-medium text-brand-purple hover:underline">
              Create free account
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Home;
