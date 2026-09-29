"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { X, MapPin, Home, Briefcase } from "lucide-react";
import {
  CustomerAddressFormSchema,
  INDIAN_STATES,
  type CustomerAddressFormData,
  type SavedCustomerAddress,
  type AddressType,
} from "../types";
import {
  addCustomerAddressAction,
  updateCustomerAddressAction,
} from "../actions/address-actions";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedAddress: SavedCustomerAddress) => void;
  initialData?: SavedCustomerAddress | null;
  totalAddressesCount: number;
}

function AddressFormModalInner({
  initialData,
  onClose,
  onSuccess,
  totalAddressesCount,
}: Omit<AddressModalProps, "isOpen">) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<CustomerAddressFormData>(() => ({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    addressLine1: initialData?.addressLine1 || "",
    addressLine2: initialData?.addressLine2 || "",
    city: initialData?.city || "",
    state: initialData?.state || "Tamil Nadu",
    pincode: initialData?.pincode || "",
    addressType: initialData?.addressType || "home",
    isDefault: initialData ? initialData.isDefault : totalAddressesCount === 0,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (
    field: keyof CustomerAddressFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parseResult = CustomerAddressFormSchema.safeParse(formData);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const actionResult = isEditing && initialData
        ? await updateCustomerAddressAction(initialData.id, parseResult.data)
        : await addCustomerAddressAction(parseResult.data);

      if (!actionResult.success || !actionResult.address) {
        setServerError(actionResult.error || "Failed to save address. Please try again.");
        return;
      }

      onSuccess(actionResult.address);
      onClose();
    } catch {
      setServerError("An unexpected error occurred while saving your address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-brand-border/80 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
          <div className="space-y-0.5">
            <h3 className="font-heading text-xl font-semibold text-brand-dark">
              {isEditing ? "Edit Delivery Address" : "Add New Delivery Address"}
            </h3>
            <p className="text-xs text-brand-dark/60 font-sans">
              Enter recipient contact details and doorstep delivery destination.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-brand-dark/60 hover:text-brand-dark hover:bg-brand-cream/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-sans">
          {/* Address Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-dark">
              Address Label
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "home", label: "Home", icon: Home },
                { type: "work", label: "Work", icon: Briefcase },
                { type: "other", label: "Other", icon: MapPin },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange("addressType", type as AddressType)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    formData.addressType === type
                      ? "border-brand-gold bg-brand-gold/15 text-brand-dark font-semibold shadow-xs"
                      : "border-brand-border/80 text-brand-dark/70 hover:bg-brand-cream/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Phone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-dark">
                Recipient Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Sundaram"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.fullName
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                    : "border-brand-border/80 focus:border-brand-gold focus:ring-brand-gold"
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-dark">
                Phone Number (10 digits) <span className="text-rose-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-brand-border/80 bg-brand-cream/50 text-xs text-brand-dark/70 font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  maxLength={10}
                  className={`w-full px-3 py-2 rounded-r-xl border text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-1 transition-all ${
                    errors.phone
                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                      : "border-brand-border/80 focus:border-brand-gold focus:ring-brand-gold"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-dark">
              Flat, House No., Building, Apartment <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 4B, Ananya Heights"
              value={formData.addressLine1}
              onChange={(e) => handleChange("addressLine1", e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-1 transition-all ${
                errors.addressLine1
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-brand-border/80 focus:border-brand-gold focus:ring-brand-gold"
              }`}
            />
            {errors.addressLine1 && (
              <p className="text-[11px] text-rose-600 font-medium">
                {errors.addressLine1}
              </p>
            )}
          </div>

          {/* Address Line 2 (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-dark">
              Street, Area, Landmark <span className="text-brand-dark/50 text-[11px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Near Lakshmi Mills Junction, Avinashi Road"
              value={formData.addressLine2 || ""}
              onChange={(e) => handleChange("addressLine2", e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-brand-border/80 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
            />
          </div>

          {/* City & Pincode Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-dark">
                City / District <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Coimbatore"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.city
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                    : "border-brand-border/80 focus:border-brand-gold focus:ring-brand-gold"
                }`}
              />
              {errors.city && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.city}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-dark">
                Pincode (6 digits) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="641018"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                maxLength={6}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.pincode
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                    : "border-brand-border/80 focus:border-brand-gold focus:ring-brand-gold"
                }`}
              />
              {errors.pincode && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.pincode}
                </p>
              )}
            </div>
          </div>

          {/* State Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-dark">
              State / Union Territory <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-brand-border/80 text-xs text-brand-dark bg-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-[11px] text-rose-600 font-medium">
                {errors.state}
              </p>
            )}
          </div>

          {/* Make Default Checkbox (Only if not already forced default by 0 addresses) */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                disabled={totalAddressesCount === 0}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
                className="h-4 w-4 rounded border-brand-border text-brand-dark focus:ring-brand-gold disabled:opacity-60"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-brand-dark block">
                  Set as default delivery address
                </span>
                {totalAddressesCount === 0 && (
                  <span className="text-[11px] text-brand-dark/50 block">
                    Your first address is automatically set as the default.
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-brand-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {isEditing ? "Save Changes" : "Save Address"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddressModal(props: AddressModalProps) {
  if (!props.isOpen) return null;

  return (
    <AddressFormModalInner
      key={props.initialData ? props.initialData.id : "new"}
      initialData={props.initialData}
      onClose={props.onClose}
      onSuccess={props.onSuccess}
      totalAddressesCount={props.totalAddressesCount}
    />
  );
}
