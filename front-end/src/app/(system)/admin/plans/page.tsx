"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, CheckCircle, XCircle, Trash2, MoreVertical, Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Feature = { name: string; included: boolean };
type GlobalFeature = { id: string; name: string; createdAt: string };

export default function AdminPlansPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [globalFeatures, setGlobalFeatures] = useState<GlobalFeature[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "", description: "", 
    prices: {} as Record<string, string>,
    intervals: [] as string[],
    maxUsers: 1, maxTenants: 1, includedChats: 150, extraChatPrice: "0,15",
    trialDays: 0,
    features: [] as Feature[]
  });
  
  const [newFeatureName, setNewFeatureName] = useState("");

  const loadData = async () => {
    try {
      const token = (session?.user as any)?.accessToken;
      
      const [plansRes, featuresRes] = await Promise.all([
        fetch(getBackendUrl('/api/admin/plans'), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(getBackendUrl('/api/admin/plan-features'), { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const plansData = await plansRes.json();
      const featuresData = await featuresRes.json();
      
      if (plansData.success) setPlans(plansData.data);
      if (featuresData.success) setGlobalFeatures(featuresData.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  const handleAddGlobalFeature = async () => {
    if (!newFeatureName.trim()) return;
    try {
      const token = (session?.user as any)?.accessToken;
      const res = await fetch(getBackendUrl('/api/admin/plan-features'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFeatureName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Funcionalidade adicionada");
        setNewFeatureName("");
        loadData();
      } else {
        toast.error(data.error || "Erro ao adicionar funcionalidade");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    }
  };

  const handleDeleteGlobalFeature = async (id: string) => {
    try {
      const token = (session?.user as any)?.accessToken;
      const res = await fetch(getBackendUrl(`/api/admin/plan-features?id=${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Funcionalidade removida");
        loadData();
      } else {
        toast.error(data.error || "Erro ao remover funcionalidade");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    }
  };

  const openNewPlanModal = () => {
    setEditingPlanId(null);
    const defaultFeatures = globalFeatures.map(f => ({ name: f.name, included: false }));
    setNewPlan({
      name: "", description: "", 
      prices: { monthly: "0,00" }, intervals: ["monthly"],
      maxUsers: 1, maxTenants: 1, includedChats: 150, extraChatPrice: "0,15",
      trialDays: 0,
      features: defaultFeatures
    });
    setShowModal(true);
  };

  const openEditPlanModal = (planGroup: any) => {
    const intervals = Object.keys(planGroup);
    const firstPlan = planGroup[intervals[0]];
    const prices: Record<string, string> = {};
    
    intervals.forEach(int => {
      prices[int] = Number(planGroup[int].price).toFixed(2).replace('.', ',');
    });

    // Synchronize saved features with current global features
    const savedFeatures: Feature[] = firstPlan.features || [];
    const savedMap = new Map(savedFeatures.map(f => [f.name, f.included]));
    
    const syncedFeatures: Feature[] = globalFeatures.map(gf => ({
      name: gf.name,
      included: savedMap.get(gf.name) ?? false
    }));

    setEditingPlanId(firstPlan.name);
    setNewPlan({
      name: firstPlan.name,
      description: firstPlan.description || "",
      prices,
      intervals,
      maxUsers: firstPlan.maxUsers,
      maxTenants: firstPlan.maxTenants,
      includedChats: firstPlan.includedChats,
      extraChatPrice: Number(firstPlan.extraChatPrice).toFixed(2).replace('.', ','),
      trialDays: firstPlan.trialDays || 0,
      features: syncedFeatures
    });
    setShowModal(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") value = "0";
    value = (Number(value) / 100).toFixed(2).replace(".", ",");
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setNewPlan({ ...newPlan, [field]: value });
  };

  const parsePrice = (priceStr: string) => {
    return Number(priceStr.replace(/\./g, "").replace(",", "."));
  };

  const toggleFeatureIncluded = (index: number) => {
    const updated = [...newPlan.features];
    updated[index].included = !updated[index].included;
    setNewPlan({ ...newPlan, features: updated });
  };

  const handleSave = async () => {
    if (!newPlan.name || newPlan.intervals.length === 0) {
      return toast.error("Nome e pelo menos um intervalo são obrigatórios.");
    }
    
    try {
      const token = (session?.user as any)?.accessToken;
      
      const method = editingPlanId ? "PUT" : "POST";
      
      const parsedPrices: Record<string, number> = {};
      for (const int of newPlan.intervals) {
        parsedPrices[int] = parsePrice(newPlan.prices[int] || "0,00");
      }

      const body = {
        ...newPlan,
        id: editingPlanId, // name
        prices: parsedPrices,
        extraChatPrice: parsePrice(newPlan.extraChatPrice),
      };

      const res = await fetch(getBackendUrl('/api/admin/plans'), {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingPlanId ? "Plano atualizado com sucesso!" : "Plano criado com sucesso! Sincronizado com Mercado Pago.");
        setShowModal(false);
        loadData();
      } else {
        toast.error(data.error || "Erro ao salvar plano");
      }
    } catch (e) {
      toast.error("Erro na requisição");
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Planos</h1>
          <p className="text-muted-foreground mt-1">Configure os planos e o banco global de funcionalidades.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Funcionalidades Globais */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funcionalidades Globais</CardTitle>
              <CardDescription>Cadastre as funcionalidades que poderão ser ativadas/desativadas nos planos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Nova funcionalidade..." 
                  value={newFeatureName}
                  onChange={e => setNewFeatureName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddGlobalFeature(); }}
                />
                <Button onClick={handleAddGlobalFeature} size="icon"><Plus className="w-4 h-4" /></Button>
              </div>

              {globalFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma funcionalidade cadastrada.</p>
              ) : (
                <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {globalFeatures.map(f => (
                    <li key={f.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md text-sm border">
                      <span>{f.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleDeleteGlobalFeature(f.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Planos */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Planos Cadastrados</h2>
            <Button onClick={openNewPlanModal}><Plus className="w-4 h-4 mr-2" /> Novo Plano</Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {plans.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">Nenhum plano cadastrado.</p>
            )}
            {Object.entries(
              plans.reduce((acc, p) => {
                const key = p.name.trim();
                if (!acc[key]) acc[key] = {};
                acc[key][p.interval] = p;
                return acc;
              }, {} as Record<string, any>)
            ).map(([name, group]: [string, any]) => {
              const allVariations = Object.entries(group) as [string, any][];
              const firstPlan = allVariations[0][1];
              const intervalLabel = (int: string) => 
                int === 'yearly' ? 'Anual' : int === 'semiannual' ? 'Semestral' : int === 'quarterly' ? 'Trimestral' : 'Mensal';
              const intervalSuffix = (int: string) => 
                int === 'yearly' ? '/ano' : int === 'semiannual' ? '/sem' : int === 'quarterly' ? '/trim' : '/mês';

              return (
                <Card key={name} className="relative overflow-hidden flex flex-col justify-between p-5 shadow-sm border-border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{name}</h3>
                        {firstPlan.trialDays > 0 && (
                          <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                            {firstPlan.trialDays} dias grátis
                          </span>
                        )}
                      </div>

                      {/* All price variations */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {allVariations.map(([interval, plan]) => (
                          <div key={interval} className="bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{intervalLabel(interval)}</span>
                            <div className="text-sm font-bold text-foreground">
                              R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                              <span className="text-[10px] font-normal text-muted-foreground">{intervalSuffix(interval)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Limits summary */}
                      <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        <span>{firstPlan.maxTenants} {firstPlan.maxTenants === 1 ? 'filial' : 'filiais'}</span>
                        <span>•</span>
                        <span>{firstPlan.maxUsers} {firstPlan.maxUsers === 1 ? 'usuário' : 'usuários'}/filial</span>
                        <span>•</span>
                        <span>{firstPlan.includedChats} chats IA/mês</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-primary shrink-0 hover:bg-primary/10 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEditPlanModal(group)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Sem clientes ativos</span>
                    <Button variant="secondary" size="sm" className="h-7 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 border-0" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/billing`);
                      toast.success("Link copiado!");
                    }}>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar link
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Criar Novo Plano</CardTitle>
              <CardDescription>O plano será sincronizado automaticamente com o Mercado Pago.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nome do Plano</Label>
                  <Input value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} placeholder="Ex: Premium" />
                </div>
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Input value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} placeholder="Breve resumo..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Dias de Teste (Trial)</Label>
                  <Input type="number" value={newPlan.trialDays} onChange={e => setNewPlan({...newPlan, trialDays: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Label>Variações de Cobrança</Label>
                <p className="text-xs text-muted-foreground mb-3">Marque os ciclos desejados e defina o valor para cada um.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['monthly', 'quarterly', 'semiannual', 'yearly'].map(interval => {
                    const isSelected = newPlan.intervals.includes(interval);
                    const label = interval === 'monthly' ? 'Mensal' : interval === 'quarterly' ? 'Trimestral' : interval === 'semiannual' ? 'Semestral' : 'Anual';
                    
                    return (
                      <div key={interval} className="border rounded-md p-3 space-y-3 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedIntervals = checked 
                                ? [...newPlan.intervals, interval] 
                                : newPlan.intervals.filter(i => i !== interval);
                              
                              const updatedPrices = { ...newPlan.prices };
                              if (!checked) delete updatedPrices[interval];
                              else if (!updatedPrices[interval]) updatedPrices[interval] = "0,00";

                              setNewPlan({ ...newPlan, intervals: updatedIntervals, prices: updatedPrices });
                            }}
                            className="w-4 h-4 accent-primary"
                          />
                          <Label className="cursor-pointer font-medium">{label}</Label>
                        </div>
                        {isSelected && (
                          <div className="space-y-1">
                            <Label className="text-xs">Preço (R$)</Label>
                            <Input 
                              value={newPlan.prices[interval] || ""} 
                              onChange={e => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value === "") value = "0";
                                value = (Number(value) / 100).toFixed(2).replace(".", ",");
                                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                setNewPlan({ ...newPlan, prices: { ...newPlan.prices, [interval]: value } });
                              }} 
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <Label>Lim. Filiais</Label>
                  <Input type="number" value={newPlan.maxTenants} onChange={e => setNewPlan({...newPlan, maxTenants: parseInt(e.target.value) || 1})} />
                </div>
                <div className="space-y-1">
                  <Label>Lim. Usuários / Filial</Label>
                  <Input type="number" value={newPlan.maxUsers} onChange={e => setNewPlan({...newPlan, maxUsers: parseInt(e.target.value) || 1})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <Label>Chats IA Inclusos / Mês</Label>
                  <Input type="number" value={newPlan.includedChats} onChange={e => setNewPlan({...newPlan, includedChats: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <Label>Preço Chat Extra (R$)</Label>
                  <Input value={newPlan.extraChatPrice} onChange={e => handlePriceChange(e, "extraChatPrice")} />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Funcionalidades Inclusas</Label>
                <p className="text-xs text-muted-foreground mb-3">Marque o que está incluído neste plano. Funcionalidades não marcadas serão listadas como indisponíveis (ótimo para upsell).</p>
                
                {newPlan.features.length === 0 ? (
                  <div className="bg-yellow-500/10 text-yellow-600 p-3 rounded-md text-sm">
                    Cadastre Funcionalidades Globais primeiro para listá-las aqui.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium w-20 text-center">Incluído</th>
                          <th className="px-3 py-2 text-left font-medium">Funcionalidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {newPlan.features.map((feature, idx) => (
                          <tr key={idx} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toggleFeatureIncluded(idx)}>
                            <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={feature.included} 
                                onChange={() => toggleFeatureIncluded(idx)}
                                className="cursor-pointer w-4 h-4 accent-primary"
                              />
                            </td>
                            <td className={`px-3 py-2 ${!feature.included ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                              {feature.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar Plano</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
