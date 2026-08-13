import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClientsHeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onOpenNewModal: () => void;
}

export function ClientsHeader({ searchTerm, setSearchTerm, onOpenNewModal }: ClientsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-2 w-full sm:max-w-sm">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <Input 
          placeholder="Buscar por nome ou telefone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Button onClick={onOpenNewModal} className="shrink-0"><Plus className="w-4 h-4 mr-2"/> Novo Cliente</Button>
    </div>
  );
}
