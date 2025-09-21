import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Fingerprint, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api"; // ton axios configuré

export default function Security() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    biometric: false,
    emailAlerts: false,
  });

  // Charger les préférences de sécurité
  useEffect(() => {
    const fetchSecuritySettings = async () => {
      try {
        const res = await api.get("/user/security");
        setSettings(res.data);
      } catch (error) {
        console.error("Erreur chargement sécurité :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSecuritySettings();
  }, []);

  // Basculer une préférence (biométrie ou alertes)
  const handleToggle = async (key) => {
    try {
      const updated = { ...settings, [key]: !settings[key] };
      setSettings(updated);
      await api.put("/user/security", updated);
    } catch (error) {
      console.error("Erreur mise à jour :", error);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Chargement...</p>;
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Sécurité et Confidentialité</h1>
      </div>

      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
        <Shield className="w-12 h-12 mx-auto mb-3" />
        <h2 className="text-lg font-bold">Votre compte est protégé</h2>
        <p className="text-sm text-white/80 mt-1">Gérez ici vos paramètres de sécurité</p>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {/* Change PIN */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-500" />
              <p className="font-medium">Changer le code PIN</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl("ChangePin"))}
            >
              Modifier
            </Button>
          </div>
        </Card>

        {/* Biometric */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-gray-500" />
              <p className="font-medium">Authentification biométrique</p>
            </div>
            <Switch
              checked={settings.biometric}
              onCheckedChange={() => handleToggle("biometric")}
            />
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <p className="font-medium">Alertes de sécurité par email</p>
            </div>
            <Switch
              checked={settings.emailAlerts}
              onCheckedChange={() => handleToggle("emailAlerts")}
            />
          </div>
        </Card>
      </div>

      {/* Cards Management */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Cartes enregistrées</h3>
        <p className="text-sm text-gray-600 mb-3">
          Gérez les cartes de crédit/débit que vous utilisez pour alimenter votre compte.
        </p>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate(createPageUrl("Cards"))}
        >
          Gérer mes cartes
        </Button>
      </Card>
    </div>
  );
}

