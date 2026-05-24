import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, MessageCircle, FileText, TrendingUp, Settings, Plus, Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import UploadModal from "./UploadModal";

const navItems = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/conversations", label: "Conversations", icon: MessageCircle },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/insights", label: "Insights", icon: TrendingUp },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export const AppShell = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-brand-soft-gray">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-zinc-200/80 flex flex-col
        transform transition-transform duration-200
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-5">
          <Link to="/app/home" className="text-xl font-bold tracking-tight text-zinc-900">
            Plain<span className="text-brand-purple">MD</span>
          </Link>
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={() => { setShowUpload(true); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-xl py-2.5 px-4 font-medium text-sm transition-colors"
          >
            <Plus size={18} />
            Upload records
          </button>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                  active
                    ? "bg-brand-lavender text-brand-purple"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-100 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-zinc-700 flex-1 truncate">
              {user?.name || "Guest"}
            </span>
            <ChevronDown size={16} className="text-zinc-400" />
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200/80">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1.5">
            <Menu size={22} className="text-zinc-600" />
          </button>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Plain<span className="text-brand-purple">MD</span>
          </span>
          <button className="p-1.5">
            <Bell size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        <div className="bg-zinc-50 border-t border-zinc-200/80 px-4 py-2 text-center">
          <p className="text-[11px] text-zinc-400">
            PlainMD does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional regarding medical concerns.
          </p>
        </div>
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
};

export default AppShell;
