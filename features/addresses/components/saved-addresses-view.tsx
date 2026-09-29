"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Plus, MapPin } from "lucide-react";
import type { SavedCustomerAddress } from "../types";
import { AddressCard } from "./address-card";
import { AddressModal } from "./address-modal";
import { DeleteAddressModal } from "./delete-address-modal";

interface SavedAddressesViewProps {
  initialAddresses: SavedCustomerAddress[];
}

export function SavedAddressesView({ initialAddresses }: SavedAddressesViewProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedCustomerAddress[]>(initialAddresses);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedCustomerAddress | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<SavedCustomerAddress | null>(null);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: SavedCustomerAddress) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (addr: SavedCustomerAddress) => {
    setAddressToDelete(addr);
    setIsDeleteOpen(true);
  };

  const handleFormSuccess = (saved: SavedCustomerAddress) => {
    setAddresses((prev) => {
      // If saved address was marked default, unset default on others
      const updatedList = prev.map((a) => {
        if (a.id === saved.id) return saved;
        if (saved.isDefault) return { ...a, isDefault: false };
        return a;
      });

      // If it was a new address (not found in prev), prepend it
      const exists = prev.some((a) => a.id === saved.id);
      let nextList = exists ? updatedList : [saved, ...updatedList];

      // Keep default address pinned first
      nextList = nextList.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      return nextList;
    });
    router.refresh();
  };

  const handleDeleteSuccess = (deletedId: string, newDefaultId?: string) => {
    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== deletedId);
      if (newDefaultId) {
        return remaining.map((a) => ({
          ...a,
          isDefault: a.id === newDefaultId,
        })).sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      }
      return remaining;
    });
    router.refresh();
  };

  const handleSetDefaultSuccess = () => {
    router.refresh();
  };

  const remainingForDelete = addressToDelete
    ? addresses.filter((a) => a.id !== addressToDelete.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
            Delivery Addresses
          </h2>
          <p className="text-xs text-brand-dark/70 font-sans">
            Manage your saved delivery destinations for seamless and fast doorstep checkout.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="h-4 w-4" />}
          className="whitespace-nowrap shadow-xs"
        >
          Add New Address
        </Button>
      </div>

      {/* Address Cards Grid or Empty State */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/70 bg-white p-10 sm:p-14 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-light/40 text-brand-accent">
            <MapPin className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-heading text-lg font-semibold text-brand-dark">
              No Saved Addresses Yet
            </h3>
            <p className="text-xs text-brand-dark/60 leading-relaxed font-sans">
              Save your home, office, or family delivery address now for fast, one-click ordering during checkout.
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Your First Address
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onSetDefaultSuccess={handleSetDefaultSuccess}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddressModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingAddress}
        totalAddressesCount={addresses.length}
      />

      {/* Delete Confirmation Modal */}
      <DeleteAddressModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        addressToDelete={addressToDelete}
        remainingAddresses={remainingForDelete}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
