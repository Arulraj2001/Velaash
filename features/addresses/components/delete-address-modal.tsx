"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle, X } from "lucide-react";
import type { SavedCustomerAddress } from "../types";
import { deleteCustomerAddressAction } from "../actions/address-actions";

interface DeleteAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToDelete: SavedCustomerAddress | null;
  remainingAddresses: SavedCustomerAddress[];
  onSuccess: (deletedId: string, newDefaultId?: string) => void;
}

export function DeleteAddressModal({
  isOpen,
  onClose,
  addressToDelete,
  remainingAddresses,
  onSuccess,
}: DeleteAddressModalProps) {
  const [selectedNewDefaultId, setSelectedNewDefaultId] = useState<string>(
    remainingAddresses.length > 0 ? remainingAddresses[0].id : ""
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !addressToDelete) return null;

  const isDefault = addressToDelete.isDefault;
  const hasOtherAddresses = remainingAddresses.length > 0;
  const requiresNewDefaultSelection = isDefault && hasOtherAddresses;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await deleteCustomerAddressAction(
        addressToDelete.id,
        requiresNewDefaultSelection ? selectedNewDefaultId : undefined
      );

      if (!res.success) {
        setError(res.error || "Failed to delete address.");
        setIsDeleting(false);
        return;
      }

      onSuccess(addressToDelete.id, res.newDefaultId);
      onClose();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xs animate-in fade-in-0">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-xl border border-brand-border/80 space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-address-title"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="delete-address-title" className="font-heading text-lg font-semibold text-brand-dark">
                Delete Address
              </h3>
              <p className="text-xs text-brand-dark/60 font-sans">
                {addressToDelete.fullName} – {addressToDelete.city}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-dark/50 hover:text-brand-dark hover:bg-brand-cream/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* If deleting a default address and other addresses exist, require picking new default */}
        {requiresNewDefaultSelection ? (
          <div className="space-y-3 font-sans text-xs">
            <p className="text-brand-dark/80 leading-relaxed font-medium">
              This is currently your <strong>default delivery address</strong>. Before deleting it, please choose which of your remaining addresses should become your new default:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {remainingAddresses.map((addr) => (
                <label
                  key={addr.id}
                  onClick={() => setSelectedNewDefaultId(addr.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedNewDefaultId === addr.id
                      ? "border-brand-gold bg-brand-light/20 ring-1 ring-brand-gold/40"
                      : "border-brand-border/80 hover:bg-brand-cream/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="newDefaultAddress"
                    value={addr.id}
                    checked={selectedNewDefaultId === addr.id}
                    onChange={() => setSelectedNewDefaultId(addr.id)}
                    className="mt-0.5 text-brand-gold focus:ring-brand-gold accent-brand-gold"
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-dark text-xs truncate">
                        {addr.fullName}
                      </span>
                      <span className="uppercase text-[10px] text-brand-dark/50 font-medium px-1.5 py-0.2 rounded bg-brand-light/50">
                        {addr.addressType}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-dark/70 truncate">
                      {addr.addressLine1}, {addr.city}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-brand-dark/80 leading-relaxed font-sans">
            Are you sure you want to delete this address? This action cannot be undone.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="bg-rose-700 hover:bg-rose-800 text-white border-transparent"
          >
            {requiresNewDefaultSelection ? "Set Default & Delete" : "Delete Address"}
          </Button>
        </div>
      </div>
    </div>
  );
}
