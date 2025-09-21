import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const getCardGradient = (cardType, brand) => {
  if (cardType === 'virtual') return 'bg-gradient-to-br from-purple-500 to-pink-500';
  if (brand === 'mastercard') return 'bg-gradient-to-br from-red-500 to-orange-500';
  return 'bg-gradient-to-br from-blue-500 to-indigo-600';
};

export default function CardItem({ card, isSelected }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card
        className={`p-4 text-white ${getCardGradient(card.card_type, card.card_brand)} relative overflow-hidden transition-all duration-300 ${isSelected ? 'scale-105 shadow-xl' : 'scale-100 opacity-80'}`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold">caredit {card.card_brand?.toUpperCase()}</h3>
              <div className="flex items-center gap-2 text-xs text-white/80">
                {card.card_type === 'virtual' ? (
                  <Smartphone className="w-3 h-3" />
                ) : (
                  <CreditCard className="w-3 h-3" />
                )}
                <span className="capitalize">{card.card_type}</span>
              </div>
            </div>
            {card.is_default && (
              <Badge className="bg-white/30 text-white">Défaut</Badge>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-lg font-mono tracking-wider">•••• {card.card_number?.slice(-4)}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/80 text-xs">Expire le</p>
                <p className="font-mono">{card.expiry_date}</p>
              </div>
              <p className={`font-bold text-sm ${card.status === 'active' ? 'text-green-300' : 'text-red-300'}`}>
                {card.status === 'active' ? 'Active' : 'Gelée'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

