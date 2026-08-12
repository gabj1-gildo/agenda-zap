import { AlertCircle } from "lucide-react";

export function MissingRequirementsAlert({ requirements }: { requirements: string[] }) {
  if (!requirements || requirements.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md p-4 text-sm text-amber-800 dark:text-amber-200 mt-4">
      <div className="font-semibold flex items-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4" />
        Complete seu perfil para ativar a IA
      </div>
      <p>Para conectar o WhatsApp e habilitar o atendimento automático, você precisa preencher:</p>
      <ul className="list-disc list-inside ml-2 mt-2">
        {requirements.map((req, i) => (
          <li key={i}>{req}</li>
        ))}
      </ul>
    </div>
  );
}
