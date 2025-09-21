import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Navigation, Clock, Wifi } from "lucide-react";
import api from "@/services/api"; // ✅ ton axios configuré

export default function ATMLocator({ onBack, onSelectATM }) {
  const [atms, setAtms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Charger les DAB depuis l’API
  useEffect(() => {
    const fetchATMs = async () => {
      try {
        const res = await api.get("/atms"); // ✅ backend doit exposer GET /atms
        setAtms(res.data);
      } catch (error) {
        console.error("Erreur chargement ATMs :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchATMs();
  }, []);

  // Filtrer selon la recherche
  const filteredATMs = atms.filter(
    (atm) =>
      atm.name.toLowerCase().includes(search.toLowerCase()) ||
      atm.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Trouver un DAB</h1>
          <p className="text-sm text-gray-600">DAB les plus proches de vous</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Rechercher par quartier ou adresse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Current Location */}
      <Button variant="outline" className="w-full justify-start gap-3 h-12">
        <Navigation className="w-5 h-5 text-blue-600" />
        <span>Utiliser ma position actuelle</span>
      </Button>

      {/* ATM List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">DAB disponibles</h3>
        {loading ? (
          <p className="text-gray-500">Chargement des DAB...</p>
        ) : filteredATMs.length === 0 ? (
          <p className="text-gray-500">Aucun DAB trouvé</p>
        ) : (
          filteredATMs.map((atm) => (
            <Card
              key={atm.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                !atm.available ? "opacity-60" : ""
              }`}
              onClick={() => atm.available && onSelectATM(atm)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{atm.name}</h4>
                    {atm.available ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Disponible
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        Hors service
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{atm.address}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{atm.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{atm.hours}</span>
                    </div>
                    {atm.hasWifi && (
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        <span>WiFi</span>
                      </div>
                    )}
                  </div>
                </div>

                {atm.available && (
                  <Button size="sm" variant="outline">
                    Choisir
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Map Placeholder */}
      <Card className="p-8 bg-gray-100 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-2">Carte interactive</p>
        <p className="text-sm text-gray-500">
          Visualisez tous les DAB sur la carte
        </p>
        <Button variant="outline" className="mt-3">
          Ouvrir la carte
        </Button>
      </Card>
    </div>
  );
}

