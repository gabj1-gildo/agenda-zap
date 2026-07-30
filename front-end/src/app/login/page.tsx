"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Agora enviamos apenas email e senha.
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    setLoading(false);
    
    if (res?.error) {
      toast.error("Credenciais inválidas. Tente novamente.");
    } else {
      toast.success("Acesso autorizado!");
      // Always redirect to home; ignore any callbackUrl from API routes
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") || "/";
      const safeRedirect = callbackUrl.startsWith("/api") ? "/" : callbackUrl;
      window.location.href = safeRedirect;
    }
  };

  return (
    <div
      style={{ background: "var(--background)" }}
      className="min-h-screen flex items-center justify-center absolute inset-0 z-50"
    >
      {/* Left ink panel */}
      <div
        style={{ background: "var(--primary)" }}
        className="absolute inset-y-0 left-0 w-[42%] hidden lg:flex flex-col justify-between p-12"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", transform: "rotate(-4deg)" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-2xl"
          >
            A
          </div>
          <span className="font-display font-extrabold text-2xl text-white tracking-wide">
            AgendaZap
          </span>
        </div>

        <div>
          <blockquote className="text-3xl font-display font-extrabold text-white leading-tight mb-4">
            Plataforma de gestão inteligente de negócios.
          </blockquote>
          <p style={{ color: "#9AA3C0" }} className="text-sm">
            Tudo o que você precisa em um único lugar.
          </p>
        </div>

        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          className="pt-6 flex items-center gap-3"
        >
          <div>
            <div className="text-sm font-semibold text-white">
              Autenticação Unificada
            </div>
            <div style={{ color: "#9AA3C0" }} className="text-[11px]">
              AgendaZap v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 ml-auto lg:w-[58%] flex items-center justify-center px-6 py-12">
        <div
          style={{ borderColor: "var(--border)" }}
          className="w-full max-w-md bg-card border rounded-3xl p-10 shadow-xl"
        >
          <div className="mb-8">
            <h1 className="font-display font-extrabold text-4xl text-foreground mb-2">
              Bem-vindo ao AgendaZap
            </h1>
            <p className="text-sm text-muted-foreground">
              Faça login com seu email e senha para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Senha
                </label>
                <Link href="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-8">
            AgendaZap &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
