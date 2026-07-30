import { Card } from "@/components/ui/card"
import { DollarSign, Store, Activity, Zap } from "lucide-react"

type Metrics = {
  totalTenants: number;
  activeSubscriptions: number;
  mrr: number;
  totalTokens: number;
  pixVolume: number;
}

export function AdminKPIs({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">MRR (Assinaturas)</h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            R$ {metrics.mrr.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{metrics.activeSubscriptions} assinaturas ativas</p>
        </div>
      </Card>

      <Card className="p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Volume Transacionado (Pix)</h3>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">R$ {metrics.pixVolume.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total processado na plataforma</p>
        </div>
      </Card>

      <Card className="p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Estabelecimentos Cadastrados</h3>
          <Store className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{metrics.totalTenants}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de Tenants na base</p>
        </div>
      </Card>

      <Card className="p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Consumo de IA (Tokens)</h3>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.totalTokens.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Tokens processados na API Gemini</p>
        </div>
      </Card>
    </div>
  )
}
