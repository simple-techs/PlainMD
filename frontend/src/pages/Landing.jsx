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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-12 py-4 max-w-6xl mx-auto w-full">
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

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6">
        {/* Glassmorphic blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[700px] h-[550px] animate-float">
            {/* Main blob shape */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,78,216,0.08) 0%, rgba(147,130,255,0.12) 25%, rgba(196,190,255,0.15) 50%, rgba(219,215,255,0.1) 75%, rgba(91,78,216,0.06) 100%)",
                borderRadius: "60% 40% 55% 45% / 55% 60% 40% 45%",
                backdropFilter: "blur(2px)",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow:
                  "inset 0 0 80px rgba(255,255,255,0.3), inset 0 0 20px rgba(91,78,216,0.05), 0 20px 60px rgba(91,78,216,0.06)",
              }}
            />
            {/* Glass highlight layer */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)",
                borderRadius: "60% 40% 55% 45% / 55% 60% 40% 45%",
              }}
            />
            {/* Secondary smaller blob for depth */}
            <div
              className="absolute -top-8 -right-12 w-[65%] h-[55%]"
              style={{
                background:
                  "linear-gradient(120deg, rgba(91,78,216,0.06) 0%, rgba(165,155,255,0.1) 50%, rgba(200,195,255,0.08) 100%)",
                borderRadius: "45% 55% 50% 50% / 50% 45% 55% 50%",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "inset 0 0 40px rgba(255,255,255,0.2)",
              }}
            />
            {/* Bottom accent blob */}
            <div
              className="absolute -bottom-6 -left-8 w-[50%] h-[45%]"
              style={{
                background:
                  "linear-gradient(200deg, rgba(91,78,216,0.05) 0%, rgba(180,170,255,0.1) 60%, rgba(220,215,255,0.07) 100%)",
                borderRadius: "50% 50% 40% 60% / 55% 45% 55% 45%",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "inset 0 0 30px rgba(255,255,255,0.15)",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-2xl mx-auto text-center pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="mx-auto mb-8">
            <svg
              width="56"
              height="56"
              viewBox="0 0 48 48"
              fill="none"
              className="mx-auto"
            >
              <path
                d="M24 4l4.5 10.5L39 19l-10.5 4.5L24 34l-4.5-10.5L9 19l10.5-4.5L24 4z"
                fill="#5B4ED8"
                opacity="0.5"
              />
              <path
                d="M24 10l3 7.5L34 21l-7 3L24 31l-3-7L14 21l7-3.5L24 10z"
                fill="#5B4ED8"
                opacity="0.85"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
            Medical language,{" "}
            <br className="hidden sm:block" />
            made <span className="text-brand-purple">plain.</span>
          </h1>

          <p className="mt-6 text-lg text-zinc-500 max-w-md mx-auto leading-relaxed">
            Upload your medical records and talk to your health history.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
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

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-16 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {features.map((f) => (
            <div key={f.title} className="text-left sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
                <f.icon size={22} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-6 text-center px-6">
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          PlainMD does not provide medical advice, diagnosis, or treatment.
          Always consult a qualified healthcare professional regarding medical
          concerns.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
