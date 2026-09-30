"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui";
import { Home, Briefcase, MapPin, Phone, Check, Edit2, Trash2, Star } from "lucide-react";
import type { SavedCustomerAddress } from "../types";
import { setDefaultAddressAction } from "../actions/address-actions";

interface AddressCardProps {
  address: SavedCustomerAddress;
  onEdit: (address: SavedCustomerAddress) => void;
  onDelete: (address: SavedCustomerAddress) => void;
  onSetDefaultSuccess?: () => void;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefaultSuccess,
}: AddressCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleSetDefault = () => {
    startTransition(async () => {
      const res = await setDefaultAddressAction(address.id);
      if (res.success && onSetDefaultSuccess) {
        onSetDefaultSuccess();
      }
    });
  };

  const getAddressIcon = () => {
    switch (address.addressType) {
      case "home":
        return <Home className="h-3.5 w-3.5" />;
      case "work":
        return <Briefcase className="h-3.5 w-3.5" />;
      default:
        return <MapPin className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-200 ${
        address.isDefault
          ? "border-brand-gold/80 ring-1 ring-brand-gold/30 bg-gradient-to-br from-brand-light/10 to-white"
          : "border-brand-border/80 hover:border-brand-border"
      }`}
    >
      <div className="space-y-3">
        {/* Header: Type Badge & Default Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-light/50 text-brand-dark border border-brand-border/60">
              {getAddressIcon()}
              <span>{address.addressType}</span>
            </span>

            {address.isDefault && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-brand-gold/20 text-brand-dark border border-brand-gold/40">
                <Check className="h-3 w-3 text-brand-accent" />
                Default Address
              </span>
            )}
          </div>
        </div>

        {/* Name and Phone */}
        <div className="space-y-0.5">
          <h3 className="font-heading text-base font-semibold text-brand-dark">
            {address.fullName}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-brand-muted font-sans">
            <Phone className="h-3 w-3 text-brand-muted" />
            <span>{address.phone}</span>
          </p>
        </div>

        {/* Address Lines */}
        <div className="text-xs text-brand-muted font-sans space-y-0.5 leading-relaxed pt-1">
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.state} –{" "}
            <span className="font-mono font-medium text-brand-dark">{address.pincode}</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-5 mt-4 border-t border-brand-border/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(address)}
            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
            className="text-xs"
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(address)}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            className="text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50"
          >
            Delete
          </Button>
        </div>

        {!address.isDefault && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetDefault}
            isLoading={isPending}
            leftIcon={<Star className="h-3.5 w-3.5" />}
            className="text-xs"
          >
            Set as Default
          </Button>
        )}
      </div>
    </div>
  );
}
