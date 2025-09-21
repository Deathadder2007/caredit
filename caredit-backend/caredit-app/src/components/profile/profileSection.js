import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "@/entities/all";

export default function ProfileSection({ user, setUser }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await User.updateMyUserData({
        full_name: fullName,
        email: email,
        phone_number: phone,
      });
      setUser(updatedUser);
      alert("Informations mises à jour !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Erreur lors de la mise à jour des informations");
    }
    setIsSaving(false);
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>

      <div className="space-y-3">
        <div>
          <Label>Nom complet</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <Label>Numéro de téléphone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <Button 
        className="mt-4 w-full bg-orange-500 hover:bg-orange-600"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </Card>
  );
}

