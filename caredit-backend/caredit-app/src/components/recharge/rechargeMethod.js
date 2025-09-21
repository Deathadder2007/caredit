import React from 'react';
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default function RechargeMethod({ method, onSelect }) {
  return (
    <Card 
      className="p-4 hover:shadow-md transition-all cursor-pointer hover:bg-gray-50"
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center`}>
          <method.icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{method.title}</h4>
          <p className="text-sm text-gray-600">{method.subtitle}</p>
          <p className="text-xs text-gray-500 mt-1">{method.description}</p>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Card>
  );
}
