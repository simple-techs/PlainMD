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
        {/* Liquid glass blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* SVG filter for liquid distortion */}
          <svg className="absolute w-0 h-0">
            <defs>
              <filter id="liquid-warp">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.012"
                  numOctaves="4"
                  seed="3"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="35"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <filter id="soft-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <div
            className="relative w-[750px] h-[580px] animate-float"
            style={{ filter: "url(#liquid-warp)" }}
          >
            {/* Colored background wash */}
            <div
              className="absolute inset-[-30px]"
              style={{
                background:
                  "radial-gradient(ellipse at 45% 40%, rgba(91,78,216,0.18) 0%, rgba(147,130,255,0.12) 35%, rgba(200,195,255,0.06) 65%, transparent 100%)",
                borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                filter: "blur(40px)",
              }}
            />

            {/* Main glass body */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, rgba(215,210,255,0.55) 0%, rgba(200,195,255,0.35) 25%, rgba(185,180,255,0.25) 50%, rgba(210,205,255,0.4) 75%, rgba(225,220,255,0.5) 100%)",
                borderRadius: "62% 38% 53% 47% / 48% 58% 42% 52%",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "2px solid rgba(255,255,255,0.7)",
                boxShadow:
                  "inset 0 4px 40px rgba(255,255,255,0.6), inset 0 -8px 30px rgba(91,78,216,0.06), 0 8px 40px rgba(91,78,216,0.1), 0 30px 80px rgba(91,78,216,0.06)",
              }}
            />

            {/* Top-left glass highlight / light refraction */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(150deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 18%, rgba(255,255,255,0.08) 40%, transparent 55%)",
                borderRadius: "62% 38% 53% 47% / 48% 58% 42% 52%",
              }}
            />

            {/* Inner caustic light streak */}
            <div
              className="absolute top-[12%] left-[8%] w-[60%] h-[28%]"
              style={{
                background:
                  "linear-gradient(125deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.2) 35%, transparent 65%)",
                borderRadius: "50% 50% 45% 55% / 60% 40% 60% 40%",
                filter: "blur(10px)",
              }}
            />

            {/* Secondary caustic near center */}
            <div
              className="absolute top-[40%] left-[25%] w-[50%] h-[15%]"
              style={{
                background:
                  "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.15) 60%, transparent 90%)",
                borderRadius: "50%",
                filter: "blur(12px)",
              }}
            />

            {/* Upper-right glass lobe */}
            <div
              className="absolute -top-6 right-[-35px] w-[58%] h-[50%]"
              style={{
                background:
                  "linear-gradient(130deg, rgba(215,210,255,0.45) 0%, rgba(195,190,255,0.25) 50%, rgba(225,220,255,0.35) 100%)",
                borderRadius: "48% 52% 55% 45% / 52% 48% 52% 48%",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1.5px solid rgba(255,255,255,0.55)",
                boxShadow:
                  "inset 0 3px 25px rgba(255,255,255,0.45), 0 6px 24px rgba(91,78,216,0.06)",
              }}
            />

            {/* Highlight on upper-right lobe */}
            <div
              className="absolute -top-6 right-[-35px] w-[58%] h-[50%]"
              style={{
                background:
                  "linear-gradient(140deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 25%, transparent 50%)",
                borderRadius: "48% 52% 55% 45% / 52% 48% 52% 48%",
              }}
            />

            {/* Bottom-left glass lobe */}
            <div
              className="absolute bottom-[-18px] left-[-25px] w-[50%] h-[44%]"
              style={{
                background:
                  "linear-gradient(210deg, rgba(205,200,255,0.4) 0%, rgba(180,175,255,0.2) 50%, rgba(220,215,255,0.3) 100%)",
                borderRadius: "52% 48% 45% 55% / 48% 52% 48% 52%",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1.5px solid rgba(255,255,255,0.45)",
                boxShadow:
                  "inset 0 2px 20px rgba(255,255,255,0.4), 0 4px 18px rgba(91,78,216,0.04)",
              }}
            />

            {/* Right edge refraction line */}
            <div
              className="absolute top-[25%] right-[3%] w-[12%] h-[45%]"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.35) 30%, rgba(255,255,255,0.1) 70%, transparent 100%)",
                borderRadius: "50%",
                filter: "blur(8px)",
              }}
            />

            {/* Bottom edge shadow for depth */}
            <div
              className="absolute bottom-[-5%] left-[10%] w-[80%] h-[15%]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(91,78,216,0.08) 0%, transparent 70%)",
                filter: "blur(20px)",
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
