import React, { useState } from "react";
import axios from "axios"; // Pour les appels API
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BillPaymentForm({ service, onBack }) {
  const [formData, setFormData] = useState({
    provider: "",
    accountNumber: "",
    amount: "",
    customerName: "",
  });
  const [billInfo, setBillInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Vérifie le compte/facture via API
  const handleVerifyAccount = async () => {
    if (!formData.provider || !formData.accountNumber) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.get(`/api/bills/verify`, {
        params: {
          provider: formData.provider,
          accountNumber: formData.accountNumber,
          serviceType: service.id,
        },
      });

      if (response.status === 200 && response.data) {
        setBillInfo(response.data); // { customerName, amount, dueDate, billNumber }
      } else {
        setErrorMessage("Impossible de vérifier la facture.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Erreur réseau.");
    }

    setIsLoading(false);
  };

  // Effectue le paiement via API
  const handlePayment = async () => {
    if (!formData.provider || !formData.accountNumber || (!billInfo && !formData.amount)) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post("/api/bills/pay", {
        provider: formData.provider,
        accountNumber: formData.accountNumber,
        serviceType: service.id,
        amount: billInfo?.amount || parseFloat(formData.amount),
        description: `Facture ${service.title} - ${formData.accountNumber}`,
        reference: `BILL${Date.now()}`,
      });

      if (response.status === 200) {
        alert("Paiement effectué avec succès !");
        onBack();
      } else {
        setErrorMessage("Erreur lors du paiement.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Erreur réseau.");
    }

    setIsLoading(false);
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Payer {service.title}</h1>
          <p className="text-sm text-gray-600">Choisissez votre fournisseur</p>
        </div>
      </div>

      <Card className="p-6">
        <form className="space-y-4">
          {/* Sélection du fournisseur */}
          <div>
            <Label htmlFor="provider">Fournisseur</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => setFormData({ ...formData, provider: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {service.providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Numéro de compte/facture */}
          <div>
            <Label htmlFor="accountNumber">Numéro de compte / facture</Label>
            <div className="flex gap-2">
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Ex: 123456789"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleVerifyAccount}
                disabled={!formData.provider || !formData.accountNumber || isLoading}
              >
                Vérifier
              </Button>
            </div>
          </div>

          {/* Informations de la facture */}
          {billInfo && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Informations de la facture</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span className="font-medium">{billInfo.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Montant dû:</span>
                  <span className="font-bold text-green-700">{billInfo.amount.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Échéance:</span>
                  <span>{billInfo.dueDate}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Si pas de vérification, entrer le montant manuellement */}
          {!billInfo && formData.provider && (
            <div>
              <Label htmlFor="amount">Montant (CFA)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Montant à payer"
              />
            </div>
          )}

          {/* Alert frais */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Aucuns frais supplémentaires pour ce type de paiement.</AlertDescription>
          </Alert>

          {/* Message d'erreur */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Bouton payer */}
          <Button
            type="button"
            onClick={handlePayment}
            disabled={isLoading || (!billInfo && !formData.amount)}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isLoading
              ? "Traitement..."
              : `Payer ${billInfo?.amount?.toLocaleString() || formData.amount} CFA`}
          </Button>
        </form>
      </Card>
    </div>
  );
}

