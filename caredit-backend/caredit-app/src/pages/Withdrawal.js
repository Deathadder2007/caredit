import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Banknote, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ATMLocator from "../components/withdrawal/ATMLocator";
import WithdrawalForm from "../components/withdrawal/WithdrawalForm";

// ✅ API centralisée
const API_BASE_URL = "http://localhost:4000/api"; // adapte selon ton backend

async function fetchBalance() {
  const response = await fetch(`${API_BASE_URL}/balance`);
  if (!response.ok) throw new Error("Erreur récupération solde");
  return response.json();
}

async function fetchWithdrawals() {
  const response = await fetch(`${API_BASE_URL}/withdrawals`);
  if (!response.ok) throw new Error("Erreur récupération retraits");
  return response.json();
}

async function requestWithdrawal({ amount, atmId }) {
  const response = await fetch(`${API_BASE_URL}/withdrawals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, atmId }),
  });
  if (!response.ok) throw new Error("Erreur retrait");
  return response.json();
}

export default function Withdrawal() {
  const [showATMLocator, setShowATMLocator] = useState(false);
  const [selectedATM, setSelectedATM] = useState(null);
  const [balance, setBalance] = useState({ balance: 0, dailyLimit: 0 });
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 Charger solde et retraits récents
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const b = await fetchBalance();
      setBalance(b);

      const w = await fetchWithdrawals();
      setWithdrawals(w);
    } catch (err) {
      console.error("Erreur lors du chargement :", err);
    }
  };

  // ✅ Handler de retrait (appel API + reload)
  const handleWithdrawal = async ({ amount, atmId }) => {
    setIsLoading(true);
    try {
      await requestWithdrawal({ amount, atmId });
      await loadData(); // recharge solde + retraits
    } catch (err) {
      alert("Erreur lors du retrait");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Page de sélection DAB
  if (showATMLocator) {
    return (
      <ATMLocator
        onBack={() => setShowATMLocator(false)}
        onSelectATM={(atm) => {
          setSelectedATM(atm);
          setShowATMLocator(false);
        }}
      />
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Retrait d'espèces</h1>
          <p className="text-sm text-gray-600">Retirez dans tous les DAB</p>
        </div>
      </div>

      {/* Solde */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 mb-1">Solde disponible</p>
            <p className="text-2xl font-bold text-green-800">
              {balance.balance.toLocaleString()} CFA
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 mb-1">Limite jour</p>
            <p className="font-semibold text-green-800">
              {balance.dailyLimit.toLocaleString()} CFA
            </p>
          </div>
        </div>
      </Card>

      {/* Boutons rapides */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => setShowATMLocator(true)}
          className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <MapPin className="w-6 h-6" />
          <span className="text-sm">Trouver un DAB</span>
        </Button>

        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
        >
          <Navigation className="w-6 h-6 text-purple-600" />
          <span className="text-sm text-purple-600">Code QR</span>
        </Button>
      </div>

      {/* Formulaire retrait */}
      <WithdrawalForm
        selectedATM={selectedATM}
        onWithdraw={handleWithdrawal}
        isLoading={isLoading}
      />

      {/* Liste retraits */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Retraits récents</h3>
        <div className="space-y-3">
          {withdrawals.length > 0 ? (
            withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {w.location || "DAB"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(w.date).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(w.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-red-600">
                  -{w.amount.toLocaleString()} CFA
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Aucun retrait récent.
            </p>
          )}
        </div>
      </Card>

      {/* Conseils */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Conseils</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Vérifiez votre solde avant le retrait</li>
          <li>• Masquez votre code PIN</li>
          <li>• Préférez les DAB en zone sécurisée</li>
          <li>• Aucuns frais sur les 3 premiers retraits/mois</li>
        </ul>
      </Card>
    </div>
  );
}

