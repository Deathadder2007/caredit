import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Building2, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import RechargeMethod from "../components/recharge/RechargeMethod";
import RechargeForm from "../components/recharge/RechargeForm";

const rechargeMethods = [
  {
    id: 'mobile_money',
    title: 'Mobile Money',
    subtitle: 'MTN, Orange, Moov',
    icon: Smartphone,
    color: 'bg-blue-500',
    description: 'Rechargez depuis votre compte mobile money'
  },
  {
    id: 'bank_transfer',
    title: 'Virement bancaire',
    subtitle: 'Depuis votre banque',
    icon: Building2,
    color: 'bg-green-500',
    description: 'Transfert depuis votre compte bancaire'
  },
  {
    id: 'card',
    title: 'Carte bancaire',
    subtitle: 'Visa, Mastercard',
    icon: CreditCard,
    color: 'bg-purple-500',
    description: 'Paiement sécurisé par carte'
  }
];

const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

export default function Recharge() {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [quickAmount, setQuickAmount] = useState(null);

  if (selectedMethod) {
    return (
      <RechargeForm 
        method={selectedMethod}
        quickAmount={quickAmount}
        onBack={() => {
          setSelectedMethod(null);
          setQuickAmount(null);
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
        <h1 className="text-xl font-bold text-gray-800">Recharger mon compte</h1>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <h3 className="font-semibold text-orange-800 mb-2">Solde actuel</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-orange-900">25,500</span>
          <span className="text-orange-700">CFA</span>
        </div>
      </Card>

      {/* Quick Amounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Montants rapides</h3>
        <div className="grid grid-cols-3 gap-3">
          {quickAmounts.map((amount) => (
            <Button 
              key={amount}
              variant="outline"
              className="h-12 text-sm hover:bg-orange-50 hover:border-orange-200"
              onClick={() => setQuickAmount(amount)}
            >
              {amount.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      {/* Recharge Methods */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Choisir une méthode</h3>
        <div className="space-y-3">
          {rechargeMethods.map((method) => (
            <RechargeMethod
              key={method.id}
              method={method}
              onSelect={() => setSelectedMethod(method)}
            />
          ))}
        </div>
      </div>

      {/* Promo */}
      <Card className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <h3 className="font-semibold mb-1">🎉 Offre spéciale</h3>
        <p className="text-green-100 text-sm">
          Rechargez 50 000 CFA et recevez 2 000 CFA de bonus !
        </p>
      </Card>
    </div>
  );
}

