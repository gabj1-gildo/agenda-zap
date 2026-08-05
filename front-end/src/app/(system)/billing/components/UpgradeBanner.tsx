import { AlertCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subscription } from "../types/billing";

interface UpgradeBannerProps {
  subscription: Subscription | null;
  usage: { tenants: number; users: number; chats: number } | null;
  onUpgradeClick: () => void;
}

export function UpgradeBanner({ subscription, usage, onUpgradeClick }: UpgradeBannerProps) {
  if (!subscription || !subscription.plan || !usage) return null;

  const plan = subscription.plan;
  const chatsLimit = plan.includedChats;
  const chatsUsed = usage.chats;
  
  const isOverChatsLimit = chatsUsed > chatsLimit;
  const isNearChatsLimit = chatsUsed > chatsLimit * 0.8 && !isOverChatsLimit;

  if (!isOverChatsLimit && !isNearChatsLimit) {
    return null; // Don't show if limits are comfortable
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 rounded-xl p-4 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="bg-primary/20 p-2 rounded-full mt-0.5">
          <AlertCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-foreground text-sm">
            {isOverChatsLimit 
              ? "Você está pagando por chats extras neste mês" 
              : "Seu limite de chats inclusos está quase no fim"}
          </h4>
          <p className="text-muted-foreground text-xs mt-1">
            Fazer upgrade para um plano superior pode eliminar essas cobranças adicionais e liberar mais recursos para o seu negócio.
          </p>
        </div>
      </div>
      <Button 
        onClick={onUpgradeClick}
        className="w-full sm:w-auto shrink-0 shadow-sm"
      >
        Comparar Planos
        <ArrowUpCircle className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
