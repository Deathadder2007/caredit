import React from 'react';
import { Card } from "@/components/ui/card";

export default function RecentContacts({ contacts, onSelect }) {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        Aucun contact récent
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-600 mb-3">Contacts récents</h3>
      <div className="grid grid-cols-4 gap-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelect && onSelect(contact)}
            className="flex flex-col items-center min-w-0 cursor-pointer hover:opacity-80 transition"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-medium mb-2">
              {contact.avatar}
            </div>
            <span className="text-xs text-gray-600 text-center truncate w-full px-1">
              {contact.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

