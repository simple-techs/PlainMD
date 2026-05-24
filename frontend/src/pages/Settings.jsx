import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, LogOut, User, Lock, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import AppShell from "../components/AppShell";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(null);

  const handleDeleteDocuments = async () => {
    if (!window.confirm("Delete all your documents? This cannot be undone.")) return;
    setDeleting("docs");
    try { await api.delete("/data/documents"); } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const handleDeleteConversations = async () => {
    if (!window.confirm("Delete all your conversations? This cannot be undone.")) return;
    setDeleting("convs");
    try { await api.delete("/data/conversations"); } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your entire account and all data? This cannot be undone.")) return;
    if (!window.confirm("Are you absolutely sure? All your data will be permanently deleted.")) return;
    setDeleting("account");
    try { await api.delete("/account"); await logout(); navigate("/"); } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Settings</h1>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Account</h2>
          <div className="bg-white rounded-2xl border border-zinc-200/80 divide-y divide-zinc-100">
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-brand-lavender flex items-center justify-center">
                <User size={18} className="text-brand-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{user?.name || "Guest"}</p>
                <p className="text-xs text-zinc-400">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Privacy & Data</h2>
          <div className="bg-white rounded-2xl border border-zinc-200/80 divide-y divide-zinc-100">
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Shield size={18} className="text-green-600" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">Data Privacy</p>
                <p className="text-xs text-zinc-400">Your data is encrypted and never sold. You own your data.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Lock size={18} className="text-green-600" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">HIPAA-Conscious Architecture</p>
                <p className="text-xs text-zinc-400">Built with healthcare data protection best practices.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Data Management</h2>
          <div className="bg-white rounded-2xl border border-zinc-200/80 divide-y divide-zinc-100">
            <button onClick={handleDeleteDocuments} disabled={!!deleting} className="flex items-center gap-3 p-4 w-full text-left hover:bg-zinc-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                {deleting === "docs" ? <Loader2 size={18} className="text-orange-600 animate-spin" /> : <Trash2 size={18} className="text-orange-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">Delete all documents</p>
                <p className="text-xs text-zinc-400">Remove all uploaded medical records.</p>
              </div>
            </button>
            <button onClick={handleDeleteConversations} disabled={!!deleting} className="flex items-center gap-3 p-4 w-full text-left hover:bg-zinc-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                {deleting === "convs" ? <Loader2 size={18} className="text-orange-600 animate-spin" /> : <Trash2 size={18} className="text-orange-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">Delete all conversations</p>
                <p className="text-xs text-zinc-400">Remove all chat history.</p>
              </div>
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">Danger Zone</h2>
          <div className="bg-white rounded-2xl border border-red-200 divide-y divide-zinc-100">
            <button onClick={handleDeleteAccount} disabled={!!deleting} className="flex items-center gap-3 p-4 w-full text-left hover:bg-red-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                {deleting === "account" ? <Loader2 size={18} className="text-red-600 animate-spin" /> : <AlertTriangle size={18} className="text-red-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600">Delete account</p>
                <p className="text-xs text-zinc-400">Permanently delete your account and all data.</p>
              </div>
            </button>
          </div>
        </section>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </AppShell>
  );
};

export default Settings;
