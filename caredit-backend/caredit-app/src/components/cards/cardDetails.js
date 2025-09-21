import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Lock, Unlock, Shield, Globe, Wifi } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const getStatusBadge = (status) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'blocked':
      return <Badge className="bg-red-100 text-red-800">Bloquée</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
  }
};

export default function CardDetails({ card, onToggleStatus, onSettings }) {
  if (!card) return null;

  // ✅ Données réelles venant du backend
  const dailyUsage = card.daily_usage ?? 0;
  const monthlyUsage = card.monthly_usage ?? 0;

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {card.card_type === 'physical' ? 'Carte Physique' : 'Carte Virtuelle'}
          </h3>
          {getStatusBadge(card.status)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onToggleStatus}>
            {card.status === 'active' ? (
              <><Lock className="w-4 h-4 mr-2" /> Geler</>
            ) : (
              <><Unlock className="w-4 h-4 mr-2" /> Dégeler</>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={onSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Limits */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-600">Limite quotidienne</span>
            <span className="font-medium">
              {dailyUsage.toLocaleString()} / {card.daily_limit.toLocaleString()} CFA
            </span>
          </div>
          <Progress value={Math.min((dailyUsage / card.daily_limit) * 100, 100)} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-600">Limite mensuelle</span>
            <span className="font-medium">
              {monthlyUsage.toLocaleString()} / {card.monthly_limit.toLocaleString()} CFA
            </span>
          </div>
          <Progress value={Math.min((monthlyUsage / card.monthly_limit) * 100, 100)} className="h-2" />
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
        <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
          <Shield className="w-5 h-5 mb-1 text-blue-600" />
          <span className="text-xs text-gray-700">En ligne</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
          <Wifi className="w-5 h-5 mb-1 text-green-600" />
          <span className="text-xs text-gray-700">Sans contact</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg">
          <Globe className="w-5 h-5 mb-1 text-purple-600" />
          <span className="text-xs text-gray-700">International</span>
        </div>
      </div>
    </Card>
  );
}

