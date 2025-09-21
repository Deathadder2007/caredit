import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const getTransactionIcon = (type) => {
  switch (type) {
    case 'transfer': return ArrowUpRight;
    case 'payment': return CreditCard;
    case 'recharge': return Plus;
    default: return ArrowDownLeft;
  }
};

const getTransactionColor = (type) => {
  switch (type) {
    case 'transfer': return 'text-red-500 bg-red-50';
    case 'payment': return 'text-orange-500 bg-orange-50';
    case 'recharge': return 'text-green-500 bg-green-50';
    default: return 'text-blue-500 bg-blue-50';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
    default:
      return null;
  }
};

export default function TransactionItem({ transaction }) {
  const Icon = getTransactionIcon(transaction.type);
  const colorClass = getTransactionColor(transaction.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}  // départ : invisible et un peu plus bas
      animate={{ opacity: 1, y: 0 }}   // arrivée : visible et à sa place
      exit={{ opacity: 0, y: -20 }}    // sortie (optionnel si tu supprimes des transactions)
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-800 truncate">
                {transaction.recipient}
              </p>
              <div className="flex flex-col items-end">
                <p className={`font-bold text-lg ${
                  transaction.type === 'recharge' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'recharge' ? '+' : '-'}{transaction.amount.toLocaleString()} CFA
                </p>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 truncate mb-2">
              {transaction.description || `Transaction ${transaction.type}`}
            </p>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {format(new Date(transaction.created_date), "EEEE d MMMM yyyy, HH:mm", { locale: fr })}
              </p>
              {transaction.reference && (
                <p className="text-xs text-gray-400 font-mono">
                  {transaction.reference}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

