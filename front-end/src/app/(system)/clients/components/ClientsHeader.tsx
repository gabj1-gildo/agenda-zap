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
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de clientes do seu estabelecimento.</p>
        </div>
        <Button onClick={onOpenNewModal}><Plus className="w-4 h-4 mr-2"/> Novo Cliente</Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou telefone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </>
  );
}
