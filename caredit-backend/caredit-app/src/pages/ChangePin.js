import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import api from "@/services/api"; // ton axios configuré

export default function ChangePin() {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      alert("Tous les champs sont obligatoires");
      return;
    }
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      alert("Le code PIN doit contenir 4 chiffres");
      return;
    }
    if (newPin !== confirmPin) {
      alert("Les nouveaux PIN ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      await api.put("/user/security/pin", {
        currentPin,
        newPin,
      });
      alert("Code PIN modifié avec succès ✅");
      navigate(createPageUrl("Security"));
    } catch (error) {
      alert("Erreur lors du changement de PIN: " + error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link to={createPageUrl("Security")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Changer le code PIN</h1>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-5">
        <div>
          <Label htmlFor="currentPin">PIN actuel</Label>
          <Input
            id="currentPin"
            type="password"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            maxLength={4}
            placeholder="****"
          />
        </div>

        <div>
          <Label htmlFor="newPin">Nouveau PIN</Label>
          <Input
            id="newPin"
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            maxLength={4}
            placeholder="****"
          />
        </div>

        <div>
          <Label htmlFor="confirmPin">Confirmer le nouveau PIN</Label>
          <Input
            id="confirmPin"
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            maxLength={4}
            placeholder="****"
          />
        </div>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleChangePin}
          disabled={isLoading}
        >
          {isLoading ? "Mise à jour..." : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Mettre à jour le PIN
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}

