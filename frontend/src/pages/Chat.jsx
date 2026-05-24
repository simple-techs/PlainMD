import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import AppShell from "../components/AppShell";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convTitle, setConvTitle] = useState("");
  const [documentId, setDocumentId] = useState(null);
  const [loading, setLoading] = useState(!!conversationId);
  const messagesEndRef = useRef(null);
  const [currentConvId, setCurrentConvId] = useState(conversationId || null);

  useEffect(() => {
    if (!conversationId) return;
    const loadConversation = async () => {
      try {
        const { data } = await api.get(`/conversations/${conversationId}`);
        setConvTitle(data.conversation?.title || "");
        setDocumentId(data.conversation?.document_id || null);
        const msgs = (data.messages || []).map((m) => ({
          id: m.message_id,
          role: m.role,
          content: formatDocSummary(m.content),
        }));
        setMessages(msgs);
        setCurrentConvId(conversationId);
      } catch (err) {
        console.error("Failed to load conversation", err);
      } finally {
        setLoading(false);
      }
    };
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDocSummary = (content) => {
    if (typeof content === "string") {
      try { content = JSON.parse(content); } catch { return content; }
    }
    if (content?.type === "document_summary") {
      let text = content.summary || "";
      if (content.key_findings?.length) {
        text += "\n\nKey findings:\n" + content.key_findings.map((f) => `\u2022 ${f}`).join("\n");
      }
      return text;
    }
    if (typeof content === "object") {
      return content.summary || content.text || JSON.stringify(content);
    }
    return String(content);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: `temp_${Date.now()}`, role: "user", content: userMessage }]);

    try {
      const payload = {
        message: userMessage,
        conversation_id: currentConvId || undefined,
        document_id: documentId || undefined,
      };
      const { data } = await api.post("/chat", payload);
      if (!currentConvId) {
        setCurrentConvId(data.conversation_id);
        window.history.replaceState(null, "", `/app/chat/${data.conversation_id}`);
      }
      setMessages((prev) => [...prev, { id: data.message_id, role: "assistant", content: data.response }]);
    } catch (err) {
      const detail = err.response?.data?.detail || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { id: `err_${Date.now()}`, role: "error", content: detail }]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (msg) => {
    if (msg.role === "user") {
      return (
        <div key={msg.id} className="flex justify-end mb-4 animate-fade-in">
          <div className="max-w-[80%] bg-brand-purple text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm leading-relaxed">
            {msg.content}
          </div>
        </div>
      );
    }
    if (msg.role === "error") {
      return (
        <div key={msg.id} className="flex mb-4 animate-fade-in">
          <div className="max-w-[80%] bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-md px-4 py-3 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {msg.content}
          </div>
        </div>
      );
    }
    return (
      <div key={msg.id} className="flex mb-4 animate-fade-in">
        <div className="max-w-[80%] bg-white border border-zinc-200/80 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <div className="border-b border-zinc-200/80 bg-white px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => navigate("/app/home")} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <ArrowLeft size={20} className="text-zinc-500" />
          </button>
          <h2 className="text-sm font-semibold text-zinc-900 truncate">{convTitle || "New conversation"}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-purple" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-brand-lavender flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                  <path d="M24 8l4.5 10.5L39 23l-10.5 4.5L24 38l-4.5-10.5L9 23l10.5-4.5L24 8z" fill="#5B4ED8" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Ask anything about your health</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                I can help you understand medical terms, compare results, and explain what your records mean in simple language.
              </p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}

          {sending && (
            <div className="flex mb-4">
              <div className="bg-white border border-zinc-200/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-brand-purple/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-brand-purple/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-brand-purple/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-zinc-200/80 bg-white px-4 py-3 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-sm outline-none bg-zinc-50 rounded-xl px-4 py-2.5 border border-zinc-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-brand-purple text-white flex items-center justify-center hover:bg-brand-purple-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
};

export default Chat;
