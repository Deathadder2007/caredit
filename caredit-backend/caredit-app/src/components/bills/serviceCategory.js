import React from 'react';
import { Card } from "@/components/ui/card";

export default function ServiceCategory({ category, onSelect }) {
  return (
    <Card 
      className="p-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
      onClick={onSelect}
    >
      <div className="text-center">
        <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
          <category.icon className="w-6 h-6 text-white" />
        </div>
        <h4 className="font-medium text-gray-800 mb-1">{category.title}</h4>
        <p className="text-xs text-gray-500">
          {category.providers.length} fournisseurs
        </p>
      </div>
    </Card>
  );
}
