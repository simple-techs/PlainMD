import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Trash2, Loader2, Plus } from "lucide-react";
import { api } from "../lib/api";
import AppShell from "../components/AppShell";

const Conversations = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/conversations");
        setConversations(data.conversations || []);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Conversations</h1>
          <button
            onClick={() => navigate("/app/chat")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dark transition-colors"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-brand-purple" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-lavender flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={24} className="text-brand-purple" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">No conversations yet</h3>
            <p className="text-sm text-zinc-400">Upload a document or ask a question to start a conversation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.conversation_id}
                onClick={() => navigate(`/app/chat/${conv.conversation_id}`)}
                className="w-full flex items-center justify-between bg-white rounded-2xl border border-zinc-200/80 p-4 hover:border-brand-purple/20 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-brand-lavender flex items-center justify-center shrink-0">
                    <MessageCircle size={16} className="text-brand-purple" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{conv.title}</p>
                    <p className="text-xs text-zinc-400">{formatDate(conv.updated_at)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.conversation_id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Conversations;
