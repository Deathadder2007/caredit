import React, { useState, useEffect } from 'react';
import { Transaction, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const mobileMoneyProviders = ['MTN MoMo', 'Orange Money', 'Moov Money'];

export default function RechargeForm({ method, quickAmount, onBack }) {
  const [formData, setFormData] = useState({
    amount: quickAmount || '',
    provider: '',
    phoneNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (quickAmount) setFormData(prev => ({ ...prev, amount: quickAmount }));
  }, [quickAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    setShowConfirmation(true);
  };

  const confirmRecharge = async () => {
    setIsLoading(true);
    try {
      // Create transaction
      await Transaction.create({
        type: 'recharge',
        amount: parseFloat(formData.amount),
        recipient: method.title,
        description: `Rechargement via ${method.title}`,
        reference: `RCH${Date.now()}`,
        status: 'completed',
        provider: formData.provider || method.title
      });

      // Update user balance
      const currentUser = await User.me();
      await User.updateMyUserData({
        balance: (currentUser.balance || 0) + parseFloat(formData.amount)
      });

      alert('Rechargement effectué avec succès !');
      onBack();
    } catch (error) {
      alert('Erreur lors du rechargement');
    }
    setIsLoading(false);
  };

  if (showConfirmation) {
    return (
      <div className="p-4 space-y-6 max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowConfirmation(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Confirmer le rechargement</h1>
        </div>

        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Confirmer votre rechargement</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Méthode:</span>
              <span className="font-medium">{method.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-bold text-lg text-green-600">+{parseFloat(formData.amount).toLocaleString()} CFA</span>
            </div>
            {formData.provider && (
              <div className="flex justify-between">
                <span className="text-gray-600">Fournisseur:</span>
                <span className="font-medium">{formData.provider}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={confirmRecharge} 
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              {isLoading ? 'Traitement...' : 'Confirmer le rechargement'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="w-full"
            >
              Modifier
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{method.title}</h1>
          <p className="text-sm text-gray-600">{method.description}</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant à recharger (CFA)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="Ex: 10000"
              min="500"
              required
            />
          </div>

          {method.id === 'mobile_money' && (
            <>
              <div>
                <Label htmlFor="provider">Fournisseur Mobile Money</Label>
                <Select value={formData.provider} onValueChange={(value) => setFormData({...formData, provider: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {mobileMoneyProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+225 07 12 34 56 78"
                  required
                />
              </div>
            </>
          )}

          {method.id === 'card' && (
            <>
              <div>
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Date d'expiration</Label>
                  <Input
                    id="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    placeholder="MM/AA"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={formData.cvv}
                    onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                    placeholder="123"
                    maxLength="3"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Votre rechargement sera instantané et sécurisé.
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={!formData.amount}
          >
            Continuer
          </Button>
        </form>
      </Card>
    </div>
  );
}

