import React, { useState, useEffect, useCallback } from "react";
import { Transaction } from "@/entities/all";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ShoppingBag, Banknote } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const getIcon = (type) => {
  switch (type) {
    case "card_payment":
      return ShoppingBag;
    case "atm_withdrawal":
      return Banknote;
    default:
      return ArrowUpRight;
  }
};

export default function CardTransactionHistory({ cardId }) {
  const [transactions, setTransactions] = useState([]);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Récupérer les dernières transactions
      const cardTransactions = await Transaction.filter(
        { card_id: cardId },
        "-created_date",
        10 // on peut ajuster le nombre de transactions
      );
      setTransactions(cardTransactions);

      // Calculer daily et monthly usage dynamiquement
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let daily = 0;
      let monthly = 0;

      cardTransactions.forEach((tx) => {
        const txDate = new Date(tx.created_date);
        monthly += tx.amount;

        if (
          txDate.getDate() === today.getDate() &&
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        ) {
          daily += tx.amount;
        }
      });

      setDailyUsage(daily);
      setMonthlyUsage(monthly);
    } catch (error) {
      console.error("Erreur transactions carte:", error);
    }
    setIsLoading(false);
  }, [cardId]);

  useEffect(() => {
    if (cardId) loadTransactions();
  }, [cardId, loadTransactions]);

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-800 mb-3">
        Dernières transactions de la carte
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-6 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const Icon = getIcon(tx.type);
            const isDebit = tx.type !== "refund"; // Différencier débit/crédit
            return (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{tx.recipient}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(tx.created_date), "d MMM, HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <p
                  className={`font-semibold ${
                    isDebit ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {isDebit ? "-" : "+"}
                  {tx.amount.toLocaleString()} CFA
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucune transaction pour cette carte.
        </p>
      )}

      {/* Usage summary */}
      {!isLoading && (
        <div className="mt-4 text-sm text-gray-700">
          <p>
            <strong>Utilisation quotidienne:</strong> {dailyUsage.toLocaleString()} CFA
          </p>
          <p>
            <strong>Utilisation mensuelle:</strong> {monthlyUsage.toLocaleString()} CFA
          </p>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="text-center pt-3">
          <button className="text-blue-600 text-sm hover:underline">
            Voir toutes les transactions
          </button>
        </div>
      )}
    </Card>
  );
}

