import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function RecentTransactions({ transactions }) {
  if (!transactions.length) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500 mb-2">Aucune transaction récente</div>
        <p className="text-sm text-gray-400">Vos transactions apparaîtront ici</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Transactions récentes</h3>
        <Link to={createPageUrl("History")}>
          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
            Tout voir <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {transactions.slice(0, 5).map((transaction) => {
          const Icon = getTransactionIcon(transaction.type);
          const colorClass = getTransactionColor(transaction.type);
          
          return (
            <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 truncate">
                      {transaction.recipient}
                    </p>
                    <p className={`font-semibold ${
                      transaction.type === 'recharge' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'recharge' ? '+' : '-'}{transaction.amount.toLocaleString()} CFA
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {transaction.description || 'Transaction'}
                  </p>
                  
                  <p className="text-xs text-gray-400">
                    {format(new Date(transaction.created_date), "d MMM, HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
