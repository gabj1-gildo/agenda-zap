import { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBackendUrl } from '@/lib/api';

type TagType = { id: string; name: string; color: string; };

export function ClientTags({ clientId, tenantId, token, initialTags = [] }: { clientId: string, tenantId: string, token: string, initialTags?: TagType[] }) {
  const [tags, setTags] = useState<TagType[]>(initialTags);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && allTags.length === 0) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/tags'), { 
        headers: { 'tenant-id': tenantId, 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } 
      });
      const json = await res.json();
      if (json.success) setAllTags(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const assignTag = async (tag: TagType) => {
    try {
      await fetch(getBackendUrl(`/api/clients/${clientId}/tags`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` },
        body: JSON.stringify({ tagId: tag.id }),
      });
      if (!tags.find(t => t.id === tag.id)) {
        setTags([...tags, tag]);
      }
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      await fetch(getBackendUrl(`/api/clients/${clientId}/tags`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` },
        body: JSON.stringify({ tagId }),
      });
      setTags(tags.filter(t => t.id !== tagId));
    } catch (err) {
      console.error(err);
    }
  };

  const unassignedTags = allTags.filter(t => !tags.find(assigned => assigned.id === t.id));

  return (
    <div className="relative flex items-center gap-1">
      {tags.map(tag => (
        <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="flex items-center gap-1 text-white border-none cursor-default">
          {tag.name}
          <button onClick={() => removeTag(tag.id)} className="hover:opacity-75">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute top-8 left-0 w-64 bg-card border border-border rounded-lg shadow-lg z-50 p-3">
          <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider flex items-center">
            <Tag className="w-3 h-3 mr-1" /> Adicionar Tag
          </h4>
          
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
            {unassignedTags.map(tag => (
              <button 
                key={tag.id}
                onClick={() => assignTag(tag)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-md flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
            {unassignedTags.length === 0 && allTags.length > 0 && (
              <div className="text-xs text-muted-foreground italic px-2">Todas as tags já foram atribuídas.</div>
            )}
            {allTags.length === 0 && (
              <div className="text-xs text-muted-foreground italic px-2">Nenhuma tag criada.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
