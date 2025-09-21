import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield, Globe, Bell } from "lucide-react";

export default function CardSettings({ card, onBack, onUpdate, onDelete }) {
  const [settings, setSettings] = useState({
    daily_limit: card.daily_limit || 100000,
    monthly_limit: card.monthly_limit || 1000000,
    online_payments: card.online_payments ?? true,
    contactless: card.contactless ?? true,
    international: card.international ?? false,
    notifications: card.notifications ?? true,
  });

  const handleSave = async () => {
    try {
      await onUpdate(settings); // passe par Cards → Card.update
      onBack();
    } catch (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette carte ?")) return;
    try {
      await onDelete(card.id); // passe par Cards → Card.delete
      onBack();
    } catch (error) {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">Paramètres carte</h1>
      </div>

      {/* Limits */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Limites de transaction
        </h3>

        <div className="space-y-4">
          <div>
            <Label>Limite quotidienne</Label>
            <Select
              value={settings.daily_limit.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, daily_limit: parseInt(value) })
              }
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
            <Label>Limite mensuelle</Label>
            <Select
              value={settings.monthly_limit.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, monthly_limit: parseInt(value) })
              }
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
        </div>
      </Card>

      {/* Payment Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-600" />
          Types de paiement
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Paiements en ligne</p>
              <p className="text-sm text-gray-500">E-commerce et applications</p>
            </div>
            <Switch
              checked={settings.online_payments}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, online_payments: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sans contact</p>
              <p className="text-sm text-gray-500">Tap to pay</p>
            </div>
            <Switch
              checked={settings.contactless}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, contactless: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Paiements internationaux</p>
              <p className="text-sm text-gray-500">Hors zone UEMOA</p>
            </div>
            <Switch
              checked={settings.international}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, international: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          Notifications
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notifications de transaction</p>
            <p className="text-sm text-gray-500">
              Recevoir un SMS pour chaque paiement
            </p>
          </div>
          <Switch
            checked={settings.notifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, notifications: checked })
            }
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Sauvegarder les modifications
        </Button>

        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleDelete}
        >
          Supprimer cette carte
        </Button>
      </div>
    </div>
  );
}

