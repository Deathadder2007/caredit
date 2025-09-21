import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TransferForm({ prefillData }) {
  const [formData, setFormData] = useState({
    recipient: "",
    recipient_phone: "",
    amount: "",
    description: "",
    provider: "myfeda",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (prefillData) {
      setFormData((prev) => ({
        ...prev,
        recipient: prefillData.recipient,
        recipient_phone: prefillData.recipient_phone,
      }));
    }
  }, [prefillData]);

  // Valide le formulaire avant confirmation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.recipient || !formData.amount || !formData.recipient_phone) return;
    setShowConfirmation(true);
    setErrorMessage("");
  };

  // Effectue le transfert via API
  const confirmTransfer = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post("/api/transactions/transfer", {
        recipient: formData.recipient,
        recipient_phone: formData.recipient_phone,
        amount: parseFloat(formData.amount),
        description: formData.description,
        provider: formData.provider,
        reference: `TRF${Date.now()}`,
      });

      if (response.status === 200) {
        alert("Transfert effectué avec succès !");
        setFormData({
          recipient: "",
          recipient_phone: "",
          amount: "",
          description: "",
          provider: "myfeda",
        });
        setShowConfirmation(false);
      } else {
        setErrorMessage("Erreur lors du transfert.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Erreur réseau.");
    }

    setIsLoading(false);
  };

  if (showConfirmation) {
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Confirmer le transfert</h3>
          <p className="text-gray-600 text-sm">Vérifiez les détails avant de confirmer</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Destinataire:</span>
            <span className="font-medium">{formData.recipient}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Téléphone:</span>
            <span className="font-medium">{formData.recipient_phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Montant:</span>
            <span className="font-bold text-lg">{parseFloat(formData.amount).toLocaleString()} CFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Frais:</span>
            <span>50 CFA</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-medium">Total:</span>
            <span className="font-bold">{(parseFloat(formData.amount) + 50).toLocaleString()} CFA</span>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={confirmTransfer}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? "Traitement..." : "Confirmer le transfert"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Nouveau transfert</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="recipient">Nom du destinataire</Label>
          <Input
            id="recipient"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            placeholder="Ex: Marie Kouakou"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.recipient_phone}
            onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
            placeholder="+228 90 12 34 56"
            required
          />
        </div>

        <div>
          <Label htmlFor="provider">Fournisseur</Label>
          <Select
            value={formData.provider}
            onValueChange={(value) => setFormData({ ...formData, provider: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="myfeda">MyFeda</SelectItem>
              <SelectItem value="mtn">MTN MoMo</SelectItem>
              <SelectItem value="moov">Moov Money</SelectItem>
              <SelectItem value="orange">Orange Money</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Montant (CFA)</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0"
            min="100"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Message (optionnel)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ajouter un message..."
            rows={3}
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Frais de transfert: 50 CFA. Les transferts sont instantanés.
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600"
          disabled={!formData.recipient || !formData.amount || !formData.recipient_phone}
        >
          Continuer
        </Button>
      </form>
    </Card>
  );
}

