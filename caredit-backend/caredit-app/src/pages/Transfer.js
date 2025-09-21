import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, QrCode, Users, History } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import TransferForm from "../components/transfer/TransferForm";
import ContactsList from "../components/transfer/ContactsList";
import RecentContacts from "../components/transfer/RecentContacts";

const mockContacts = [
  { id: 1, name: "Jean Agbodji", phone: "+22890112233", avatar: "J" },
  { id: 2, name: "Afi Kossi", phone: "+22899887766", avatar: "A" },
  { id: 3, name: "Marie Kouakou", phone: "+2250712345678", avatar: "M" },
  { id: 4, name: "Akim Boni", phone: "+22966554433", avatar: "A" },
];

export default function Transfer() {
  const [activeTab, setActiveTab] = useState("send");
  const [showContacts, setShowContacts] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Transfert d'argent</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("send")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
            activeTab === "send"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-600"
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Envoyer
        </button>
        <button
          onClick={() => setActiveTab("receive")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
            activeTab === "receive"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-600"
          }`}
        >
          <QrCode className="w-4 h-4 inline mr-2" />
          Recevoir
        </button>
      </div>

      {activeTab === "send" ? (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-16 flex flex-col gap-1 hover:bg-orange-50 hover:border-orange-200"
              onClick={() => setShowContacts(true)}
            >
              <Users className="w-5 h-5 text-orange-600" />
              <span className="text-sm">Mes contacts</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex flex-col gap-1 hover:bg-green-50 hover:border-green-200"
            >
              <History className="w-5 h-5 text-green-600" />
              <span className="text-sm">Récents</span>
            </Button>
          </div>

          {/* Recent Contacts */}
          <RecentContacts contacts={mockContacts.slice(0, 4)} />

          {/* Transfer Form */}
          <TransferForm prefillData={prefillData} />
        </div>
      ) : (
        /* Receive Tab */
        <Card className="p-6 text-center">
          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <QrCode className="w-24 h-24 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Votre QR Code</h3>
          <p className="text-gray-600 text-sm mb-4">
            Partagez ce code pour recevoir des paiements
          </p>
          <Button className="w-full bg-green-500 hover:bg-green-600">
            Partager mon QR Code
          </Button>
        </Card>
      )}

      {/* Contacts Modal */}
      {showContacts && (
        <ContactsList
          contacts={mockContacts}
          onClose={() => setShowContacts(false)}
          onSelectContact={(contact) => {
            setPrefillData({
              recipient: contact.name,
              recipient_phone: contact.phone,
            });
            setShowContacts(false);
          }}
        />
      )}
    </div>
  );
}

