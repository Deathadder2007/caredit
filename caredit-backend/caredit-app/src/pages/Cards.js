import React, { useState, useEffect } from "react";
import { Card, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card as UICard } from "@/components/ui/card";
import { ArrowLeft, Plus, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CardItem from "../components/cards/CardItem";
import CardOrderForm from "../components/cards/CardOrderForm";
import CardSettings from "../components/cards/CardSettings";
import CardDetails from "../components/cards/CardDetails";
import CardTransactionHistory from "../components/cards/CardTransactionHistory";

import { AnimatePresence, motion } from "framer-motion";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // 🔄 Charger les cartes du user
  const loadCards = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const userCards = await Card.filter(
        { created_by: currentUser.email },
        "-created_date"
      );
      setCards(userCards);

      // Sélection automatique de la carte par défaut ou la première carte
      if (userCards.length > 0) {
        setSelectedCard(userCards.find((c) => c.is_default) || userCards[0]);
      } else {
        setSelectedCard(null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des cartes:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCards();
  }, []);

  // 📦 Commander une nouvelle carte
  const handleOrderCard = async (cardData) => {
    try {
      const newCard = await Card.create({
        ...cardData,
        card_number: `4532 **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
        expiry_date: "12/28",
        status: "pending",
      });
      setCards([newCard, ...cards]);
      setSelectedCard(newCard);
      setShowOrderForm(false);
    } catch (error) {
      alert("Erreur lors de la commande");
    }
  };

  // ⚙️ Mettre à jour les paramètres d’une carte
  const handleUpdateCardSettings = async (updatedSettings) => {
    try {
      const updatedCard = await Card.update(selectedCard.id, updatedSettings);
      const updatedCards = cards.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );
      setCards(updatedCards);
      setSelectedCard(updatedCard);
      setShowSettings(false);
    } catch (error) {
      alert("Erreur lors de la sauvegarde des paramètres");
    }
  };

  // ❌ Supprimer une carte
  const handleDeleteCard = async (cardId) => {
    try {
      await Card.delete(cardId);
      const updatedCards = cards.filter((c) => c.id !== cardId);
      setCards(updatedCards);
      setSelectedCard(updatedCards[0] || null);
      setShowSettings(false);
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  // 🔄 Changer le statut de la carte (active / blocked)
  const toggleCardStatus = async (cardId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "blocked" : "active";
      const updatedCard = await Card.update(cardId, { status: newStatus });
      const updatedCards = cards.map((card) =>
        card.id === updatedCard.id ? updatedCard : card
      );
      setCards(updatedCards);
      setSelectedCard(updatedCard);
    } catch (error) {
      alert("Erreur lors de la modification du statut");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800 flex-1">Mes Cartes</h1>
        {!showOrderForm && !showSettings && (
          <Button
            onClick={() => setShowOrderForm(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Formulaire de commande */}
        {showOrderForm && (
          <motion.div
            key="order-form"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <CardOrderForm
              onSubmit={handleOrderCard}
              onCancel={() => setShowOrderForm(false)}
            />
          </motion.div>
        )}

        {/* Paramètres de la carte */}
        {showSettings && selectedCard && (
          <motion.div
            key="card-settings"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <CardSettings
              card={selectedCard}
              onBack={() => setShowSettings(false)}
              onUpdate={handleUpdateCardSettings}
              onDelete={handleDeleteCard}
              refreshCards={loadCards}
            />
          </motion.div>
        )}

        {/* Liste des cartes */}
        {!showOrderForm && !showSettings && (
          <motion.div
            key="card-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Carrousel de cartes */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="min-w-[80%] md:min-w-0"
                  onClick={() => setSelectedCard(card)}
                >
                  <CardItem
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                  />
                </div>
              ))}
            </div>

            {/* Détails et transactions de la carte sélectionnée */}
            {selectedCard ? (
              <div className="space-y-6">
                <CardDetails
                  card={selectedCard}
                  onToggleStatus={() =>
                    toggleCardStatus(selectedCard.id, selectedCard.status)
                  }
                  onSettings={() => setShowSettings(true)}
                />
                <CardTransactionHistory cardId={selectedCard.id} />
              </div>
            ) : (
              <UICard className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Aucune carte disponible
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Commandez votre première carte caredit gratuite.
                </p>
                <Button
                  onClick={() => setShowOrderForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Commander ma carte
                </Button>
              </UICard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

