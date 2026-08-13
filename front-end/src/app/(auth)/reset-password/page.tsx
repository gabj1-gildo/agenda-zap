"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { data: session, update } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('A senha deve ter pelo menos 8 caracteres, contendo 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.');
      return;
    }

    setLoading(true);

    try {
      const token = (session as any)?.user?.accessToken;
      
      const res = await fetch('/api/backend/api/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Erro ao redefinir a senha.');
        setLoading(false);
        return;
      }

      toast.success('Senha atualizada com sucesso! Redirecionando...');
      setTimeout(() => {
        signOut({ callbackUrl: '/login' });
      }, 1500);
      
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
      setLoading(false);
    }
  };

  // Real-time validations
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^a-zA-Z\d]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

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
            Acesso Seguro.
          </blockquote>
          <p style={{ color: "#9AA3C0" }} className="text-sm">
            Para garantir a segurança da sua conta, atualize sua senha.
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
              Definir Nova Senha
            </h1>
            <p className="text-sm text-muted-foreground">
              Para sua segurança, é obrigatório atualizar a sua senha temporária para uma permanente.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-sm flex items-center gap-3">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Senha Temporária
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ex: AgendaZap2026*"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ul className="text-[10px] text-muted-foreground mt-2 space-y-1 leading-tight">
                <li className={hasMinLength ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Mínimo de 8 caracteres</li>
                <li className={hasUpper && hasLower ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Letras maiúsculas e minúsculas</li>
                <li className={hasNumber ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Pelo menos um número</li>
                <li className={hasSpecial ? "text-green-600 dark:text-green-400 font-medium" : ""}>• Pelo menos um caractere especial (!@#$%, etc)</li>
              </ul>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  style={{ borderColor: confirmPassword && !passwordsMatch ? 'rgb(225 29 72)' : confirmPassword && passwordsMatch ? 'rgb(22 163 74)' : 'var(--border)', background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-[10px] mt-1.5 font-medium ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-rose-600'}`}>
                  {passwordsMatch ? '✓ As senhas coincidem' : '✗ As senhas não coincidem'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-4"
            >
              {loading ? "Atualizando..." : "Confirmar Alteração"}
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
