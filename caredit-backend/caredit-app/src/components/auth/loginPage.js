import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard, Shield } from "lucide-react";
import api from "@/services/api"; // ton axios configuré

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // pour inscription
  const [isLoading, setIsLoading] = useState(false);

  // Connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      alert("Connexion réussie ✅");
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Inscription
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/auth/register", { name, email, password });
      alert("Inscription réussie 🎉 Connectez-vous maintenant !");
    } catch (err) {
      alert(err.response?.data?.message || "Échec de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col justify-center items-center p-4">
      <Card className="p-8 w-full max-w-sm shadow-lg">
        {/* Logo + titre */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Bienvenue sur caredit</h1>
          <p className="text-gray-600 mt-2">Votre portefeuille numérique</p>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Se connecter</TabsTrigger>
            <TabsTrigger value="register">S’inscrire</TabsTrigger>
          </TabsList>

          {/* Formulaire Connexion */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </TabsContent>

          {/* Formulaire Inscription */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
              >
                {isLoading ? "Inscription..." : "S’inscrire"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Pied de page */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" /> Vos informations sont protégées
          </p>
          <p className="mt-2">
            En continuant, vous acceptez nos{" "}
            <a href="#" className="underline">Termes & Conditions</a>.
          </p>
        </div>
      </Card>
    </div>
  );
}

