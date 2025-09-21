
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Smartphone,
  CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const getCardGradient = (cardType, brand) => {
  if (cardType === 'virtual') {
    return 'bg-gradient-to-br from-purple-500 to-pink-500';
  }
  if (brand === 'mastercard') {
    return 'bg-gradient-to-br from-red-500 to-orange-500';
  }
  return 'bg-gradient-to-br from-blue-500 to-indigo-600';
};

export default function MainCardDisplay({ card, balance, onToggleStatus }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className={`p-6 text-white ${getCardGradient(card.card_type, card.card_brand)} relative overflow-hidden shadow-2xl shadow-blue-500/20`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full transform -translate-x-4 translate-y-4" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">caredit {card.card_brand?.toUpperCase()}</h3>
            <div className="flex items-center gap-2 text-sm text-white/80">
              {card.card_type === 'virtual' ? (
                <Smartphone className="w-4 h-4" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span className="capitalize">{card.card_type}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Solde du compte</p>
            <p className="text-2xl font-bold">{balance.toLocaleString()} CFA</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm">Numéro de carte</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
              className="text-white hover:bg-white/20 h-7 w-7 rounded-full"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          {showDetails ? (
            <p className="text-xl font-mono tracking-wider">{card.card_number}</p>
          ) : (
            <p className="text-xl font-mono tracking-wider">•••• •••• •••• {card.card_number?.slice(-4)}</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={onToggleStatus}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-none"
          >
            {card.status === 'active' ? (
              <><Lock className="w-4 h-4 mr-2" /> Geler la carte</>
            ) : (
              <><Unlock className="w-4 h-4 mr-2" /> Dégeler</>
            )}
          </Button>
          <Link to={createPageUrl("Cards")}>
            <Button variant="link" className="text-white">Gérer ma carte</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

