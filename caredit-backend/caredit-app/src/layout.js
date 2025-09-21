import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/all";
import { 
  Home, 
  ArrowLeftRight, 
  CreditCard, 
  History, 
  User as UserIcon,
  Shield
} from "lucide-react";

import LoginPage from "../components/auth/LoginPage";

const navigationItems = [
  {
    title: "Accueil",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Ma Carte",
    url: createPageUrl("Cards"),
    icon: CreditCard,
  },
  {
    title: "Transferts",
    url: createPageUrl("Transfer"),
    icon: ArrowLeftRight,
  },
  {
    title: "Sécurité",
    url: createPageUrl("Security"),
    icon: Shield,
  },
  {
    title: "Historique",
    url: createPageUrl("History"),
    icon: History,
  },
  {
    title: "Profil",
    url: createPageUrl("Profile"),
    icon: UserIcon,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await User.me();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <style>{`
        :root {
          --wave-blue: #1B4DE4;
          --wave-purple: #7B2CBF;
          --wave-green: #00B894;
          --wave-orange: #E17055;
        }
        .text-wave-blue { color: var(--wave-blue); }
        .bg-wave-blue { background-color: var(--wave-blue); }
        .text-wave-purple { color: var(--wave-purple); }
        .bg-wave-purple { background-color: var(--wave-purple); }
        .text-wave-green { color: var(--wave-green); }
        .bg-wave-green { background-color: var(--wave-green); }
      `}</style>
      
      {/* Header Mobile */}
      <div className="bg-white text-gray-800 px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">caredit</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-6 gap-1 px-2 py-2">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200 ${
                location.pathname === item.url 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
