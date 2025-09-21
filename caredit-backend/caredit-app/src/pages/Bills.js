import React, { useState, useEffect } from "react";
import { Transaction, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Zap, Droplets, Wifi, Smartphone, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ServiceCategory from "../components/bills/ServiceCategory";
import BillPaymentForm from "../components/bills/BillPaymentForm";

const serviceCategories = [
  { id: 'electricity', title: 'Électricité', icon: Zap, color: 'bg-yellow-500', providers: ['CIE', 'SBEE', 'CEET'] },
  { id: 'water', title: 'Eau', icon: Droplets, color: 'bg-blue-500', providers: ['SODECI', 'SONEB', 'TdE'] },
  { id: 'internet', title: 'Internet', icon: Wifi, color: 'bg-purple-500', providers: ['Orange', 'MTN', 'Moov'] },
  { id: 'mobile', title: 'Téléphone', icon: Smartphone, color: 'bg-green-500', providers: ['Orange', 'MTN', 'Moov', 'Telecel'] },
  { id: 'tv', title: 'Télévision', icon: Tv, color: 'bg-red-500', providers: ['Canal+', 'StarTimes', 'MyTV'] }
];

export default function Bills() {
  const [selectedService, setSelectedService] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [currentUserBalance, setCurrentUserBalance] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await User.me();
      setCurrentUserBalance(user.balance || 0);
      const bills = await Transaction.list({ type: 'payment', status: 'pending' });
      setRecentBills(bills);
    };
    fetchUser();
  }, []);

  if (selectedService) {
    return <BillPaymentForm service={selectedService} onBack={() => setSelectedService(null)} />;
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Paiement de factures</h1>
      </div>

      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-800 mb-1">Factures récentes</h3>
            <p className="text-green-600 text-sm">{recentBills.length} factures en attente</p>
          </div>
          <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-100">
            Voir tout
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Choisir un service</h3>
        <div className="grid grid-cols-2 gap-4">
          {serviceCategories.map(category => (
            <ServiceCategory key={category.id} category={category} onSelect={() => setSelectedService(category)} />
          ))}
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Paiement rapide</h3>
        <p className="text-sm text-gray-600 mb-4">Entrez votre numéro de facture pour un paiement express</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Numéro de facture"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button className="bg-orange-500 hover:bg-orange-600">Payer</Button>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <h3 className="font-semibold text-orange-800">Solde actuel</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-orange-900">{currentUserBalance.toLocaleString()}</span>
          <span className="text-orange-700">CFA</span>
        </div>
      </Card>
    </div>
  );
}

