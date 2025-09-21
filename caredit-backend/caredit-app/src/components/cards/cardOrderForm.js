import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, Smartphone } from "lucide-react";

export default function CardOrderForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    card_type: 'physical',
    card_brand: 'visa',
    daily_limit: 500000,
    monthly_limit: 2000000
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la commande. Veuillez réessayer.");
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="card-order-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-4 space-y-6 max-w-md mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onCancel} disabled={isLoading}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Commander une carte</h1>
        </div>

        {/* Card Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Type de carte</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`p-4 cursor-pointer border-2 ${
                formData.card_type === 'physical' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => !isLoading && setFormData({...formData, card_type: 'physical'})}
            >
              <div className="text-center">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold">Physique</h4>
                <p className="text-xs text-gray-600 mt-1">Livraison 3-5 jours</p>
                <p className="text-xs font-semibold text-green-600 mt-1">Gratuite</p>
              </div>
            </Card>
            
            <Card 
              className={`p-4 cursor-pointer border-2 ${
                formData.card_type === 'virtual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => !isLoading && setFormData({...formData, card_type: 'virtual'})}
            >
              <div className="text-center">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold">Virtuelle</h4>
                <p className="text-xs text-gray-600 mt-1">Disponible immédiatement</p>
                <p className="text-xs font-semibold text-green-600 mt-1">Gratuite</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="brand">Marque de la carte</Label>
              <Select 
                value={formData.card_brand} 
                onValueChange={(value) => setFormData({...formData, card_brand: value})}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="daily_limit">Limite quotidienne (CFA)</Label>
              <Select 
                value={formData.daily_limit.toString()} 
                onValueChange={(value) => setFormData({...formData, daily_limit: parseInt(value)})}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100000">100,000 CFA</SelectItem>
                  <SelectItem value="250000">250,000 CFA</SelectItem>
                  <SelectItem value="500000">500,000 CFA</SelectItem>
                  <SelectItem value="1000000">1,000,000 CFA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="monthly_limit">Limite mensuelle (CFA)</Label>
              <Select 
                value={formData.monthly_limit.toString()} 
                onValueChange={(value) => setFormData({...formData, monthly_limit: parseInt(value)})}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000000">1,000,000 CFA</SelectItem>
                  <SelectItem value="2000000">2,000,000 CFA</SelectItem>
                  <SelectItem value="5000000">5,000,000 CFA</SelectItem>
                  <SelectItem value="10000000">10,000,000 CFA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Commande en cours...' : 'Commander ma carte'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Info */}
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">✅ Votre carte sera:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Gratuite à vie</li>
            <li>• Acceptée dans le monde entier</li>
            <li>• Avec cashback sur vos achats</li>
            <li>• Contrôlable depuis cette app</li>
          </ul>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

