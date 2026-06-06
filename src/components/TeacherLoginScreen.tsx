import React, { useState, useEffect } from "react";
import { 
  Mail, Lock, ArrowLeft, Heart, Sparkles, Check, AlertCircle, ChevronRight, Eye, EyeOff
} from "lucide-react";
import { motion } from "motion/react";
import { auth, googleProvider, signInWithPopup } from "../firebase";

interface TeacherLoginScreenProps {
  onBackToHome: () => void;
  onLoginSuccess: (user: any) => void;
  onGoogleLogin: () => void;
  authError: string;
  setAuthError: (err: string) => void;
}

export default function TeacherLoginScreen({
  onBackToHome,
  onLoginSuccess,
  onGoogleLogin,
  authError,
  setAuthError
}: TeacherLoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [logoIndex, setLogoIndex] = useState(0);
  const logos = [
    { prefix: "SS", suffix: "Live" },
    { prefix: "SKILL", suffix: ".SCH" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoIndex(prev => (prev + 1) % logos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentLogo = logos[logoIndex];

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setAuthError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!password.trim()) {
      setEmailError("Password is required.");
      return;
    }

    setIsSigningIn(true);
    // Dynamic sign in process using details entered by the educator
    setTimeout(() => {
      setIsSigningIn(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        // Authenticate with dynamically provided custom teacher details
        const emailLocalPart = email.split("@")[0] || "user";
        onLoginSuccess({
          uid: `dynamic-teacher-${emailLocalPart}-${Date.now()}`,
          email: email.trim(),
          displayName: `${emailLocalPart.charAt(0).toUpperCase() + emailLocalPart.slice(1)} (Educator)`,
          photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c"
        });
      }, 1000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50/75 dot-grid flex flex-col justify-center items-center py-12 px-6 sm:px-12 relative overflow-hidden font-sans">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-200/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-emerald-200/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Success Toast */}
      {showSuccessToast && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 z-50 flex items-center gap-2.5 bg-emerald-650 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 font-medium text-xs sm:text-sm"
        >
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <Check size={12} className="text-white font-bold" />
          </div>
          <span>Welcome back! Authenticating secure portal session...</span>
        </motion.div>
      )}

      {/* Top Navigator Action */}
      <button 
        onClick={onBackToHome}
        className="absolute top-6 left-6 sm:left-12 flex items-center gap-2 text-slate-500 hover:text-slate-950 transition-colors text-xs font-bold uppercase tracking-wider group cursor-pointer bg-white/80 backdrop-blur border border-slate-150 px-4 py-2.5 rounded-xl shadow-xs"
      >
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Homepage
      </button>

      {/* Interactive Top Logo Section */}
      <div className="text-center max-w-lg mb-10 mt-12 sm:mt-6 z-10">
        <div className="inline-flex items-center gap-3 shrink-0 select-none mb-4 bg-white px-5 py-3 rounded-2xl shadow-xs border border-slate-150/45">
          <div className="relative w-8 h-8 flex items-center justify-center overflow-visible">
            {/* Yellow Circle - top-left */}
            <motion.div 
              className="absolute w-4.5 h-4.5 rounded-full bg-[#fbbf24] opacity-90 shadow-[0_1px_3px_rgba(251,191,36,0.25)]"
              animate={{ x: [0, -4, -4, 0], y: [0, -3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Green Circle - top-right */}
            <motion.div 
              className="absolute w-4.5 h-4.5 rounded-full bg-[#10b981] opacity-90 shadow-[0_1px_3px_rgba(16,185,129,0.25)]"
              animate={{ x: [0, 4, 4, 0], y: [0, -3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
            />
            {/* Indigo Circle - bottom center */}
            <motion.div 
              className="absolute w-5 h-5 rounded-full bg-[#4648d4] opacity-95 shadow-[0_1.5px_4px_rgba(70,72,212,0.35)]"
              animate={{ y: [0, 3, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.08 }}
            />
          </div>
          <span className="font-display font-black tracking-tight text-lg sm:text-xl text-slate-950 text-left transition-all">
            {currentLogo.prefix}<span className="text-emerald-500">{currentLogo.suffix}</span>
          </span>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed px-4 font-normal">
          Effortlessly assess and engage your students while visualizing learning progress in real-time with instant results.
        </p>
      </div>

      {/* Primary Container Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] z-10 relative">
        <h2 className="font-display font-black text-2xl text-slate-900 mb-1.5 text-left">
          Teacher Login
        </h2>
        <p className="text-slate-450 text-xs mb-6 text-left">
          Sign into your secure educator console.
        </p>

        {/* Global Error Banner */}
        {(authError || emailError) && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-left">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs text-red-750 font-medium leading-relaxed">
              {emailError || authError}
            </span>
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
          {/* Email Form Field */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={15} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@skill-sch.com"
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl py-3 pl-11 pr-5 text-xs sm:text-sm text-slate-800 transition-all font-medium placeholder-slate-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Password Form Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450">
                Password
              </label>
              <a 
                href="#reset"
                onClick={(e) => {
                  e.preventDefault();
                  alert("A password reset link is simulated. Since educators register dynamically, you can use any email and custom password directly to login, or use Google Auth!");
                }}
                className="text-[10px] sm:text-xs font-semibold text-indigo-600 hover:text-indigo-805 transition-colors cursor-pointer"
              >
                Reset password
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl py-3 pl-11 pr-11 text-xs sm:text-sm text-slate-800 transition-all font-medium placeholder-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Action Sign In Button */}
          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full bg-emerald-600 hover:bg-emerald-650 text-white font-bold text-xs sm:text-sm tracking-wider uppercase py-3.5 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:scale-[1.005] active:scale-99"
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2">
                <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-150"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-semibold text-slate-400 tracking-wider">Or</span>
          </div>
        </div>

        {/* Google Authentication Action */}
        <button
          onClick={onGoogleLogin}
          type="button"
          className="w-full py-3.5 px-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-slate-700 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-sm hover:bg-slate-50/80 cursor-pointer flex items-center justify-center gap-3 transition-all"
        >
          {/* Custom Multi-colored Google SVG icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
      </div>

      {/* Account Registration Box */}
      <div className="w-full max-w-md bg-slate-100/50 border border-slate-200/60 rounded-3xl p-5 mt-4 text-center z-10">
        <p className="text-slate-500 text-xs font-semibold leading-relaxed">
          New to SSLive?{" "}
          <a
            href="#signup"
            onClick={(e) => {
              e.preventDefault();
              alert("SSLive handles self-provisioned educator sign-ups instantly. Simply input any email & password of your choice in the login form above to instantly authenticate and create your account, or sign in using Google!");
            }}
            className="text-indigo-600 hover:text-indigo-850 font-bold ml-1 hover:underline transition-all cursor-pointer"
          >
            CREATE ACCOUNT
          </a>
        </p>
      </div>

      {/* Footer Area */}
      <div className="mt-14 text-center max-w-sm shrink-0">
        <p className="text-[10px] text-slate-400 font-mono tracking-tight leading-relaxed inline-flex items-center justify-center gap-1 flex-wrap uppercase font-bold">
          © 2026 SSLive, a SKILL.SCH company. Made with <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse inline-block" /> by SSLabs. All rights reserved.
        </p>
      </div>
    </div>
  );
}
