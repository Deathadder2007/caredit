import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  Banknote
} from "lucide-react";

const actions = [
  {
    title: "Envoyer",
    icon: ArrowUpRight,
    color: "bg-blue-500 hover:bg-blue-600",
    url: "Transfer"
  },
  {
    title: "Recevoir",
    icon: ArrowDownLeft,
    color: "bg-green-500 hover:bg-green-600",
    url: "Transfer"
  },
  {
    title: "Recharger",
    icon: Plus,
    color: "bg-purple-500 hover:bg-purple-600",
    url: "Recharge"
  },
  {
    title: "Retirer",
    icon: Banknote,
    color: "bg-orange-500 hover:bg-orange-600",
    url: "Withdrawal"
  }
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.title} to={createPageUrl(action.url)}>
            <Button 
              className={`w-full h-20 flex flex-col gap-2 ${action.color} text-white shadow-lg rounded-2xl`}
              variant="default"
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
