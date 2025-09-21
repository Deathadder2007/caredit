import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Banknote } from "lucide-react";

export default function WithdrawalForm({ selectedATM, onWithdraw }) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickAmounts = [10000, 25000, 50000, 100000];

  const handleSubmit = async () => {
    const withdrawalAmount = parseInt(amount);
    if (!withdrawalAmount || withdrawalAmount < 5000) {
      alert("Montant minimum: 5,000 CFA");
      return;
    }

    if (!selectedATM) {
      alert("Veuillez sélectionner un DAB avant de continuer");
      return;
    }

    setIsLoading(true);
    try {
      await onWithdraw(withdrawalAmount, selectedATM.id);
      setAmount(""); // reset après succès
    } catch (error) {
      alert("Erreur lors du retrait: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Générer un code de retrait</h3>

      {selectedATM && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
          <MapPin className="w-4 h-4 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">{selectedATM.name}</p>
            <p className="text-sm text-blue-600">{selectedATM.address}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Montant à retirer (CFA)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Minimum 5,000 CFA"
            min="5000"
            max="500000"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum: 500,000 CFA par jour
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Montants rapides</p>
          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="h-12 hover:bg-blue-50 hover:border-blue-200"
              >
                {quickAmount.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span>Montant:</span>
            <span>{parseInt(amount || 0).toLocaleString()} CFA</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>Frais:</span>
            <span>{parseInt(amount || 0) > 100000 ? "500 CFA" : "Gratuit"}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total à débiter:</span>
            <span>
              {(
                parseInt(amount || 0) +
                (parseInt(amount || 0) > 100000 ? 500 : 0)
              ).toLocaleString()}{" "}
              CFA
            </span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!amount || parseInt(amount) < 5000 || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Génération..." : (
            <>
              <Banknote className="w-4 h-4 mr-2" />
              Générer le code
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

