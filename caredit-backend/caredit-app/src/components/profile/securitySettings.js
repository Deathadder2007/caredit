import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User } from "@/entities/all";

export default function SecuritySettings({ user, setUser }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor || false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    setIsSavingPassword(true);
    try {
      await User.updatePassword(currentPassword, newPassword);
      alert("Mot de passe mis à jour !");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe :", error);
      alert("Erreur lors de la mise à jour du mot de passe");
    }
    setIsSavingPassword(false);
  };

  const handleToggleTwoFactor = async (enabled) => {
    try {
      await User.updateMyUserData({ two_factor: enabled });
      setTwoFactorEnabled(enabled);
      setUser({ ...user, two_factor: enabled });
    } catch (error) {
      console.error("Erreur lors de la mise à jour 2FA :", error);
      alert("Impossible de mettre à jour l'authentification à deux facteurs");
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold mb-4">Paramètres de sécurité</h3>

      {/* Changer mot de passe */}
      <div className="space-y-3">
        <Label>Mot de passe actuel</Label>
        <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />

        <Label>Nouveau mot de passe</Label>
        <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />

        <Label>Confirmer le mot de passe</Label>
        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

        <Button
          className="mt-2 w-full bg-orange-500 hover:bg-orange-600"
          onClick={handleChangePassword}
          disabled={isSavingPassword}
        >
          {isSavingPassword ? "Enregistrement..." : "Changer le mot de passe"}
        </Button>
      </div>

      {/* Authentification à deux facteurs */}
      <div className="flex items-center justify-between mt-6">
        <span>Authentification à deux facteurs</span>
        <Switch 
          checked={twoFactorEnabled}
          onCheckedChange={handleToggleTwoFactor}
        />
      </div>
    </Card>
  );
}

