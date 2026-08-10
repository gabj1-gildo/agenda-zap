"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Tag, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#f43f5e', '#f5a524', '#22c55e',
  '#14b8a6', '#ec4899', '#f97316', '#06b6d4', '#64748b',
];

export function TagsSettings({ tenantId }: { tenantId: string }) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const headers = () => ({
    'tenant-id': tenantId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const loadTags = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/tags'), { headers: headers() });
      const data = await res.json();
      if (data.success) setTags(data.data);
    } catch {
      toast.error("Erro ao carregar tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (tenantId) loadTags(); }, [tenantId]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nome da tag é obrigatório"); return; }
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ name: newName.trim(), color: newColor })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag criada!");
        setNewName("");
        setNewColor(PRESET_COLORS[0]);
        loadTags();
      } else {
        toast.error(data.error || "Erro ao criar tag");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl(`/api/tags/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ name: editName.trim(), color: editColor })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag atualizada!");
        setEditingId(null);
        loadTags();
      } else {
        toast.error(data.error || "Erro ao atualizar tag");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/tags/${deleteId}`), {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag removida!");
        loadTags();
      } else {
        toast.error(data.error || "Erro ao remover tag");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="py-4 text-center text-muted-foreground text-sm">Carregando tags...</div>;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Tag"
        description="Esta tag será removida de todos os clientes. Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />

      {/* Existing Tags */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags Cadastradas
              </CardTitle>
              <CardDescription>
                Use tags para segmentar seus clientes e filtrar no Funil e Disparos.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">{tags.length} tags</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-6">
              Nenhuma tag cadastrada ainda. Crie sua primeira tag abaixo!
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-3 p-3 border rounded-xl">
                  {editingId === tag.id ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex gap-1.5 flex-wrap">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setEditColor(c)}
                              style={{ background: c, width: 18, height: 18, borderRadius: '50%', border: editColor === c ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={e => e.key === 'Enter' && handleUpdate(tag.id)}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleUpdate(tag.id)}
                        disabled={saving}
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground hover:text-text transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        style={{ width: 12, height: 12, borderRadius: '50%', background: tag.color, flexShrink: 0 }}
                      />
                      <span className="flex-1 text-sm font-medium">{tag.name}</span>
                      <Badge
                        style={{ background: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                      <button
                        onClick={() => { setEditingId(tag.id); setEditName(tag.name); setEditColor(tag.color); }}
                        className="text-muted-foreground hover:text-text transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(tag.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Tag */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Tag</CardTitle>
          <CardDescription>Crie uma nova tag para segmentar seus clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Tag</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: VIP, Novo Cliente, Interesse em X..."
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    background: c,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: newColor === c ? '3px solid var(--text)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform .15s',
                    transform: newColor === c ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>
          {newName && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <Badge style={{ background: newColor + '20', color: newColor, border: `1px solid ${newColor}40` }}>
                {newName}
              </Badge>
            </div>
          )}
          <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Tag
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
