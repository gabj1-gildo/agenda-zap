"use client";

import { useState } from "react";
import { Building2, X } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { Tenant } from "../../types/dashboard.types";

interface Props {
  onClose: () => void;
  onCreated: (t: Tenant) => void;
  token?: string;
}

export function CreateTenantModal({ onClose, onCreated, token }: Props) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }

      const res = await fetch(getBackendUrl('/api/tenants'), {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Empresa criada com sucesso!");
        onCreated(data.data as Tenant);
        onClose();
      } else {
        toast.error(data.message || "Erro ao criar empresa");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        style={{ borderColor: "var(--border)" }}
        className="bg-card rounded-3xl border shadow-2xl w-full max-w-md p-8 relative"
      >
        <button
          onClick={onClose}
          style={{ color: "var(--muted-foreground)" }}
          className="absolute top-5 right-5 hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          >
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-foreground">Nova Empresa</h2>
          <p className="text-sm text-muted-foreground mt-1">Crie o acesso para uma nova empresa na plataforma.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {[
            { key: "name", label: "Nome da empresa", placeholder: "Ex: Bela Hair Studio", type: "text" },
            { key: "email", label: "Email de acesso", placeholder: "empresa@email.com", type: "email" },
            { key: "password", label: "Senha inicial", placeholder: "Mínimo 6 caracteres", type: "password" },
            { key: "phone", label: "Telefone (opcional)", placeholder: "+55 11 9xxxx-xxxx", type: "tel" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                {label}
              </label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: key === "phone" ? formatPhone(e.target.value) : e.target.value })}
                placeholder={key === "phone" ? "+55 (11) 9 9999-9999" : placeholder}
                maxLength={key === "phone" ? 21 : undefined}
                required={key !== "phone"}
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            className="w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
          >
            {loading ? "Criando..." : "Criar Empresa"}
          </button>
        </form>
      </div>
    </div>
  );
}
