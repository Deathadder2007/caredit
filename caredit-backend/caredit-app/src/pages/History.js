import React, { useState, useEffect, useCallback } from "react";
import { Transaction, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Filter, Search, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { AnimatePresence, motion } from "framer-motion";
import TransactionItem from "../components/history/TransactionItem";
import FilterModal from "../components/history/FilterModal";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: '30days'
  });

  const applyFilters = useCallback(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      let dateLimit = new Date();
      
      switch (filters.dateRange) {
        case '7days':
          dateLimit.setDate(now.getDate() - 7);
          break;
        case '30days':
          dateLimit.setDate(now.getDate() - 30);
          break;
        case '3months':
          dateLimit.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.created_date) >= dateLimit);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filters]);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const userTransactions = await Transaction.filter(
        { created_by: currentUser.email }, 
        "-created_date", 
        100
      );
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    if (t.type === 'recharge') return sum + t.amount;
    return sum - t.amount;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Historique</h1>
      </div>

      {/* Summary Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center">
          <p className="text-sm text-blue-600 mb-1">Flux net sur la période</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalAmount >= 0 ? '+' : ''}{totalAmount.toLocaleString()}
            </span>
            <span className="text-lg text-gray-600">CFA</span>
          </div>
          <p className="text-xs text-blue-500 mt-1">
            {filteredTransactions.length} transactions trouvées
          </p>
        </div>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowFilters(true)}
        >
          <Filter className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Transactions List avec animations */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <TransactionItem transaction={transaction} />
            </motion.div>
          )) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-8 text-center">
                <div className="text-gray-500 mb-2">Aucune transaction trouvée</div>
                <p className="text-sm text-gray-400">
                  Essayez de modifier vos filtres de recherche
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <FilterModal
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

