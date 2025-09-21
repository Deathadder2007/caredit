import React, { useState, useEffect } from "react";
import Card from "@/entities/Card";
import User from "@/entities/User";
import Transaction from "@/entities/Transaction";

import { 
  Plus,
  CreditCard,
  ArrowRight
} from "lucide-react";

import { Card as UICard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import MainCardDisplay from "../components/dashboard/MainCardDisplay";
import CardActions from "../components/dashboard/CardActions";
import RecentTransactions from "../components/dashboard/RecentTransactions";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();

      if (!currentUser.balance && currentUser.balance !== 0) {
        await User.updateMyUserData({
          balance: 87250,
          phone_number: "+228 91 23 45 67"
        });
        const updatedUser = await User.me();
        setUser(updatedUser);
      } else {
        setUser(currentUser);
      }

      const userTransactions = await Transaction.filter(
        { created_by: currentUser.email }, 
        "-created_date", 
        10
      );
      setTransactions(userTransactions);

      const userCards = await Card.filter(
        { created_by: currentUser.email }, 
        "-created_date"
      );
      setCards(userCards);

    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  };

  const toggleCardStatus = async (cardId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      await Card.update(cardId, { status: newStatus });

      setCards(cards.map(card => 
        card.id === cardId ? { ...card, status: newStatus } : card
      ));
    } catch (error) {
      alert("Erreur lors de la modification");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="animate-spin rounded-full

