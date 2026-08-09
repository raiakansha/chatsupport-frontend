import React, { useState } from "react";
import { Bot, User, Mail, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

/**
 * UserOnboardingModal — shown before the chat starts.
 * Collects user name + email, stores in localStorage, and calls onComplete(user).
 */
const UserOnboardingModal = ({ onComplete }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState("intro"); // "intro" | "form"

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = "Please enter your name.";
        if (!email.trim()) {
            errs.email = "Please enter your email.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = "Please enter a valid email address.";
        }
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        const user = { name: name.trim(), email: email.trim() };
        localStorage.setItem("chatsupport_user", JSON.stringify(user));
        onComplete(user);
    };

    return (
        /* Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Top gradient accent */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

                <div className="p-8">
                    {step === "intro" ? (
                        /* ── Step 1: Intro ── */
                        <div className="flex flex-col items-center text-center gap-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
                                <Bot className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Meet Anaya</h2>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Your AI-powered support assistant from <span className="font-semibold text-foreground">Substring Technologies</span>.
                                    I can create tickets, track your issues, and notify the support team — all in one chat.
                                </p>
                            </div>

                            <div className="w-full grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                                {[
                                    { icon: "🎫", label: "Create tickets" },
                                    { icon: "📬", label: "Email alerts" },
                                    { icon: "🔍", label: "Track status" },
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/40 p-3">
                                        <span className="text-xl">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => setStep("form")}
                                className="w-full rounded-xl h-11 text-sm font-medium bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 transition-all duration-200"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        /* ── Step 2: Form ── */
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col items-center text-center gap-1.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold">Quick intro</h2>
                                <p className="text-sm text-muted-foreground">
                                    So Anaya knows who she's talking to 👋
                                </p>
                            </div>

                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    Your Name
                                </label>
                                <Input
                                    id="onboarding-name"
                                    type="text"
                                    placeholder="e.g. Akansha Rai"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setErrors((p) => ({ ...p, name: undefined }));
                                    }}
                                    className={`h-11 rounded-xl ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    Email Address
                                    <span className="ml-auto text-[10px] text-muted-foreground font-normal">Used for ticket tracking</span>
                                </label>
                                <Input
                                    id="onboarding-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrors((p) => ({ ...p, email: undefined }));
                                    }}
                                    className={`h-11 rounded-xl ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-xl h-11 text-sm font-medium bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 transition-all duration-200 mt-1"
                            >
                                Start Chatting with Anaya
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("intro")}
                                className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
                            >
                                ← Back
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserOnboardingModal;
