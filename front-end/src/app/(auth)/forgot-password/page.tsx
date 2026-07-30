"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageCircle, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");

  // Step 2
  const [code, setCode] = useState("");

  // Step 3
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Real-time validations
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^a-zA-Z\d]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Informe seu e-mail");
    setLoading(true);
    try {
      const res = await fetch("/api/backend/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, channel }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Código enviado! Verifique seu " + (channel === 'email' ? 'e-mail' : 'WhatsApp'));
        setStep(2);
      } else {
        toast.error(data.error || "Erro ao solicitar código");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return toast.error("Informe o código de 6 dígitos");
    setLoading(true);
    try {
      const res = await fetch("/api/backend/api/auth/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Código validado!");
        setStep(3);
      } else {
        toast.error(data.error || "Código inválido ou expirado");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem");
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return toast.error("A senha não atende aos requisitos mínimos");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/backend/api/auth/reset-password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Senha alterada com sucesso!");
        router.push("/login");
      } else {
        toast.error(data.error || "Erro ao atualizar senha");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ background: "var(--background)" }}
      className="min-h-screen flex items-center justify-center absolute inset-0 z-50 px-6 py-12"
    >
      <div
        style={{ borderColor: "var(--border)" }}
        className="w-full max-w-md bg-card border rounded-3xl p-10 shadow-xl"
      >
        <Link href="/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para login
        </Link>

        {step === 1 && (
          <div>
            <div className="mb-8">
              <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">
                Recuperar senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail e escolha por onde deseja receber o código de 6 dígitos.
              </p>
            </div>
            <form onSubmit={requestOTP} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  E-mail da sua conta
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Onde deseja receber?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold text-sm transition-all ${
                      channel === "email" ? "border-primary bg-primary/5 text-primary" : "border-[var(--border)] text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Mail className="w-4 h-4" /> E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("whatsapp")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold text-sm transition-all ${
                      channel === "whatsapp" ? "border-green-500 bg-green-50 text-green-600" : "border-[var(--border)] text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar Código"}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-8">
              <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">
                Código de verificação
              </h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um código para seu <strong>{channel === 'email' ? 'e-mail' : 'WhatsApp'}</strong>. Digite-o abaixo.
              </p>
            </div>
            <form onSubmit={verifyOTP} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    required
                    style={{ borderColor: "var(--border)", background: "var(--background)" }}
                    className="w-full border rounded-xl pl-12 pr-4 py-3 text-lg font-bold tracking-[0.5em] outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "Validando..." : "Validar Código"}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-8">
              <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">
                Nova Senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Crie uma nova senha segura para sua conta.
              </p>
            </div>
            <form onSubmit={updatePassword} className="space-y-5">
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ borderColor: "var(--border)", background: "var(--background)" }}
                    className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
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

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Confirme a Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ borderColor: confirmPassword && !passwordsMatch ? 'rgb(225 29 72)' : confirmPassword && passwordsMatch ? 'rgb(22 163 74)' : 'var(--border)', background: "var(--background)" }}
                    className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
                  />
                </div>
              </div>

              {confirmPassword.length > 0 && (
                <p className={`text-[10px] mt-1.5 font-medium ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-rose-600'}`}>
                  {passwordsMatch ? '✓ As senhas coincidem' : '✗ As senhas não coincidem'}
                </p>
              )}

              <ul className="text-[10px] text-muted-foreground mt-4 space-y-1 leading-tight list-none pl-0">
                <li className={hasMinLength ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Mínimo de 8 caracteres</li>
                <li className={hasUpper && hasLower ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Letras maiúsculas e minúsculas</li>
                <li className={hasNumber ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Pelo menos um número</li>
                <li className={hasSpecial ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Pelo menos um caractere especial (!@#$%, etc)</li>
              </ul>

              <button
                type="submit"
                disabled={loading}
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Redefinir Senha"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
