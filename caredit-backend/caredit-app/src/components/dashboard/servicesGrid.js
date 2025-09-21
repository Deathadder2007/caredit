import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Zap, 
  Droplets, 
  Wifi,
  Smartphone,
  Plane,
  ShoppingBag,
  GraduationCap,
  Heart
} from "lucide-react";

const services = [
  { title: "Électricité", icon: Zap, color: "bg-yellow-500", url: "Bills" },
  { title: "Internet", icon: Wifi, color: "bg-purple-500", url: "Bills" },
  { title: "Eau", icon: Droplets, color: "bg-blue-500", url: "Bills" },
  { title: "Téléphone", icon: Smartphone, color: "bg-green-500", url: "Bills" },
  { title: "Voyage", icon: Plane, color: "bg-indigo-500", url: "Travel" },
  { title: "Shopping", icon: ShoppingBag, color: "bg-pink-500", url: "Shopping" },
  { title: "Éducation", icon: GraduationCap, color: "bg-orange-500", url: "Education" },
  { title: "Santé", icon: Heart, color: "bg-red-500", url: "Health" }
];

export default function ServicesGrid() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Services</h3>
      <div className="grid grid-cols-4 gap-3">
        {services.slice(0, 8).map((service) => (
          <Link key={service.title} to={createPageUrl(service.url)}>
            <div className="text-center">
              <div className={`w-12 h-12 ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-2 hover:scale-110 transition-transform`}>
                <service.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-600 font-medium">{service.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
