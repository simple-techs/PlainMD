import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Search, Clock, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const features = [
  {
    icon: MessageCircle,
    title: "Understand anything",
    desc: "We translate complex medical terms into simple, clear language.",
  },
  {
    icon: Search,
    title: "Ask anything",
    desc: "Have a conversation about your records like you would with a friend.",
  },
  {
    icon: Clock,
    title: "Remember everything",
    desc: "We keep your history organized so you can see the big picture over time.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, loginAsGuest } = useAuth();

  React.useEffect(() => {
    if (!loading && user) navigate("/app/home");
  }, [user, loading, navigate]);

  const handleGuestStart = async () => {
    try {
      await loginAsGuest();
      navigate("/app/home");
    } catch (err) {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 sm:px-12 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight text-zinc-900">
          Plain<span className="text-brand-purple">MD</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-full border border-zinc-200 hover:border-zinc-300"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-brand-purple hover:bg-brand-purple-dark transition-colors rounded-full"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[500px] bg-gradient-to-br from-brand-purple/10 via-blue-200/20 to-indigo-100/20 rounded-full blur-3xl animate-float" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="mx-auto mb-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto opacity-70">
              <path
                d="M24 4l4.5 10.5L39 19l-10.5 4.5L24 34l-4.5-10.5L9 19l10.5-4.5L24 4z"
                fill="#5B4ED8"
                opacity="0.6"
              />
              <path
                d="M24 10l3 7.5L34 21l-7 3L24 31l-3-7L14 21l7-3.5L24 10z"
                fill="#5B4ED8"
                opacity="0.9"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
            Medical language,{" "}
            <br className="hidden sm:block" />
            made <span className="text-brand-purple">plain.</span>
          </h1>

          <p className="mt-5 text-lg text-zinc-500 max-w-md mx-auto leading-relaxed">
            Upload your medical records and talk to your health history.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={handleGuestStart}
              className="w-full max-w-xs rounded-full bg-brand-purple text-white font-semibold py-3.5 px-8 shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark hover:shadow-brand-purple/30 active:scale-[0.98] transition-all text-base"
            >
              Get started — it's free
            </button>

            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
              <Lock size={12} />
              Your data is private and encrypted
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <f.icon size={22} className="text-zinc-500" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-100 py-6 text-center px-6">
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          PlainMD does not provide medical advice, diagnosis, or treatment.
          Always consult a qualified healthcare professional regarding medical concerns.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
