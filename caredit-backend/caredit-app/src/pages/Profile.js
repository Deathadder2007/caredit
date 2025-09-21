import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  User as UserIcon, 
  Shield, 
  Bell, 
  Globe, 
  HelpCircle, 
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { motion, AnimatePresence } from "framer-motion";

import ProfileSection from "../components/profile/ProfileSection";
import SecuritySettings from "../components/profile/SecuritySettings";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Language & region state
  const [language, setLanguage] = useState('fr-FR');
  const [region, setRegion] = useState('Togo');

  // Liste des pays Afrique de l'Ouest
  const westAfricanCountries = [
    "Bénin", "Burkina Faso", "Côte d'Ivoire", "Cap-Vert",
    "Gambie", "Ghana", "Guinée", "Guinée-Bissau",
    "Libéria", "Mali", "Mauritanie", "Niger",
    "Nigeria", "Sénégal", "Sierra Leone", "Togo"
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setNotificationsEnabled(currentUser.notifications ?? true);
      setLanguage(currentUser.language ?? 'fr-FR');
      setRegion(currentUser.region ?? 'Togo');
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await User.logout();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const menuItems = [
    { id: 'profile', icon: UserIcon, title: 'Informations personnelles' },
    { id: 'security', icon: Shield, title: 'Sécurité' },
    { id: 'notifications', icon: Bell, title: 'Notifications' },
    { id: 'language', icon: Globe, title: 'Langue et région' },
    { id: 'help', icon: HelpCircle, title: 'Aide et support' },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection user={user} setUser={setUser} />;
      case 'security':
        return <SecuritySettings user={user} setUser={setUser} />;
      case 'notifications':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-800">Activer les notifications</span>
              <Switch 
                checked={notificationsEnabled}
                onCheckedChange={async (checked) => {
                  setNotificationsEnabled(checked);
                  await User.updateMyUserData({ notifications: checked });
                }}
              />
            </div>
          </Card>
        );
      case 'language':
        return (
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Langue et région</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
              <select
                value={language}
                onChange={async (e) => {
                  const lang = e.target.value;
                  setLanguage(lang);
                  await User.updateMyUserData({ language: lang });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="fr-FR">Français</option>
                <option value="en-US">Anglais</option>
                <option value="de-DE">Allemand</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
              <select
                value={region}
                onChange={async (e) => {
                  const reg = e.target.value;
                  setRegion(reg);
                  await User.updateMyUserData({ region: reg });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {westAfricanCountries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </Card>
        );
      case 'help':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Aide et support</h3>
            <p className="text-gray-600">
              Pour toute question ou problème, contactez notre support à support@caredit.com ou consultez notre FAQ.
            </p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Profil et paramètres</h1>
      </div>

      {/* Profile Header */}
      <Card className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.full_name || 'Utilisateur'}</h2>
            <p className="text-orange-100">{user?.email}</p>
            <p className="text-orange-100 text-sm">{user?.phone_number || 'Numéro non renseigné'}</p>
          </div>
        </div>
      </Card>

      {/* Balance Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Solde actuel</p>
            <p className="text-2xl font-bold text-green-600">{(user?.balance || 0).toLocaleString()} CFA</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Membre depuis</p>
            <p className="font-medium">
              {user?.created_date ? new Date(user.created_date).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card 
            key={item.id}
            className={`p-4 cursor-pointer hover:shadow-md transition-all ${
              activeSection === item.id ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
            onClick={() => setActiveSection(item.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <item.icon className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium text-gray-800">{item.title}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Theme Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              {user?.dark_mode ? <Moon className="w-5 h-5 text-purple-600" /> : <Sun className="w-5 h-5 text-purple-600" />}
            </div>
            <span className="font-medium text-gray-800">Mode sombre</span>
          </div>
          <Switch 
            checked={user?.dark_mode || false}
            onCheckedChange={async (checked) => {
              await User.updateMyUserData({ dark_mode: checked });
              setUser({ ...user, dark_mode: checked });
            }}
          />
        </div>
      </Card>

      {/* Active Section avec animation */}
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={activeSection}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sectionVariants}
          transition={{ duration: 0.3 }}
        >
          {renderActiveSection()}
        </motion.div>
      </AnimatePresence>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Se déconnecter
      </Button>

      {/* Version Info */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>caredit v1.0.0</p>
        <p>© 2024 - Votre portefeuille numérique</p>
      </div>
    </div>
  );
}

