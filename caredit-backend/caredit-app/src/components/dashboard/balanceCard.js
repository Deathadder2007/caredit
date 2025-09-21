import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function BalanceCard({ balance, showBalance, onToggleBalance }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold opacity-90">Solde disponible</h3>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggleBalance}
          className="text-white hover:bg-white/20 rounded-full"
        >
          {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </div>
      
      <div className="mb-4">
        {showBalance ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{balance.toLocaleString()}</span>
            <span className="text-lg opacity-90">CFA</span>
          </div>
        ) : (
          <div className="text-3xl font-bold">••••••</div>
        )}
      </div>
      
      <div className="text-orange-100 text-sm">
        Dernière mise à jour: maintenant
      </div>
    </Card>
  );
}
