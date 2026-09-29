"use client";

import React, { useState } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { MapPin, Plus, Check, Home, Briefcase } from "lucide-react";
import type { CheckoutFormData, SavedCustomerAddress } from "../types";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Chandigarh",
];

interface ShippingAddressStepProps {
  register: UseFormRegister<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  savedAddresses: SavedCustomerAddress[];
  isLoggedIn: boolean;
}

export function ShippingAddressStep({
  register,
  errors,
  setValue,
  savedAddresses,
  isLoggedIn,
}: ShippingAddressStepProps) {
  const hasSavedAddresses = savedAddresses && savedAddresses.length > 0;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    hasSavedAddresses ? savedAddresses[0].id : null
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(!hasSavedAddresses);

  const handleSelectSavedAddress = (addr: SavedCustomerAddress) => {
    setSelectedAddressId(addr.id);
    setIsAddingNewAddress(false);
    setValue("shippingAddress.fullName", addr.fullName, { shouldValidate: true });
    setValue("shippingAddress.phone", addr.phone, { shouldValidate: true });
    setValue("shippingAddress.addressLine1", addr.addressLine1, { shouldValidate: true });
    setValue("shippingAddress.addressLine2", addr.addressLine2 || "", { shouldValidate: true });
    setValue("shippingAddress.city", addr.city, { shouldValidate: true });
    setValue("shippingAddress.state", addr.state, { shouldValidate: true });
    setValue("shippingAddress.pincode", addr.pincode, { shouldValidate: true });
    setValue("shippingAddress.addressType", addr.addressType, { shouldValidate: true });
  };

  const handleAddNewAddressToggle = () => {
    setIsAddingNewAddress(true);
    setSelectedAddressId(null);
    setValue("shippingAddress.fullName", "");
    setValue("shippingAddress.phone", "");
    setValue("shippingAddress.addressLine1", "");
    setValue("shippingAddress.addressLine2", "");
    setValue("shippingAddress.city", "");
    setValue("shippingAddress.state", "");
    setValue("shippingAddress.pincode", "");
    setValue("shippingAddress.addressType", "home");
  };

  return (
    <div className="rounded-xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border/50">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-brand-cream">
            2
          </span>
          <h2 className="font-heading text-base sm:text-lg font-medium text-brand-dark">
            Shipping Address
          </h2>
        </div>

        {hasSavedAddresses && !isAddingNewAddress && (
          <button
            type="button"
            onClick={handleAddNewAddressToggle}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-dark transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Address</span>
          </button>
        )}

        {hasSavedAddresses && isAddingNewAddress && (
          <button
            type="button"
            onClick={() => handleSelectSavedAddress(savedAddresses[0])}
            className="text-xs font-semibold text-brand-dark/70 hover:text-brand-dark underline transition-colors"
          >
            Use Saved Address
          </button>
        )}
      </div>

      {/* 1. Saved Addresses Cards (for logged-in customers) */}
      {hasSavedAddresses && !isAddingNewAddress && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {savedAddresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => handleSelectSavedAddress(addr)}
                className={`relative flex flex-col justify-between rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-brand-dark bg-brand-cream/30 ring-1 ring-brand-dark shadow-sm"
                    : "border-brand-border/70 bg-white hover:border-brand-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
                      {addr.addressType === "work" ? (
                        <Briefcase className="h-3.5 w-3.5 text-brand-accent" />
                      ) : (
                        <Home className="h-3.5 w-3.5 text-brand-accent" />
                      )}
                      <span className="capitalize">{addr.addressType}</span>
                    </div>

                    {addr.isDefault && (
                      <span className="text-[10px] font-semibold bg-brand-dark/10 text-brand-dark px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm font-semibold text-brand-dark">{addr.fullName}</p>
                  <p className="text-xs text-brand-dark/70 mt-1 leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                  </p>
                  <p className="text-xs text-brand-dark/70">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-xs text-brand-dark/60 mt-1.5">Phone: +91 {addr.phone}</p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-brand-border/40">
                  <span className="text-[11px] font-medium text-brand-accent">
                    {isSelected ? "Delivering here" : "Deliver here"}
                  </span>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Direct Address Form (for guest users, no saved addresses, or when adding a new address) */}
      {(!hasSavedAddresses || isAddingNewAddress) && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="address-fullName" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="address-fullName"
                type="text"
                autoComplete="name"
                placeholder="Receiver's name"
                {...register("shippingAddress.fullName")}
                className={`w-full rounded-none border px-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                  errors.shippingAddress?.fullName
                    ? "border-red-500 bg-red-50/20"
                    : "border-brand-border/80 bg-white"
                }`}
              />
              {errors.shippingAddress?.fullName && (
                <p className="mt-1 text-[11px] text-red-600">{errors.shippingAddress.fullName.message}</p>
              )}
            </div>

            {/* Delivery Phone */}
            <div>
              <label htmlFor="address-phone" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Delivery Phone <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-medium text-brand-dark/60 select-none">
                  +91
                </span>
                <input
                  id="address-phone"
                  type="tel"
                  maxLength={10}
                  autoComplete="tel"
                  placeholder="9876543210"
                  {...register("shippingAddress.phone")}
                  className={`w-full rounded-none border px-3 py-2 pl-12 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                    errors.shippingAddress?.phone
                      ? "border-red-500 bg-red-50/20"
                      : "border-brand-border/80 bg-white"
                  }`}
                />
              </div>
              {errors.shippingAddress?.phone && (
                <p className="mt-1 text-[11px] text-red-600">{errors.shippingAddress.phone.message}</p>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label htmlFor="address-line1" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
              Flat, House no., Building, Street <span className="text-red-600">*</span>
            </label>
            <input
              id="address-line1"
              type="text"
              autoComplete="street-address"
              placeholder="e.g. Flat 302, Royal Palms, 5th Cross"
              {...register("shippingAddress.addressLine1")}
              className={`w-full rounded-none border px-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                errors.shippingAddress?.addressLine1
                  ? "border-red-500 bg-red-50/20"
                  : "border-brand-border/80 bg-white"
              }`}
            />
            {errors.shippingAddress?.addressLine1 && (
              <p className="mt-1 text-[11px] text-red-600">{errors.shippingAddress.addressLine1.message}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="address-line2" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
              Area, Colony, Sector, Landmark <span className="text-brand-dark/40 font-normal">(Optional)</span>
            </label>
            <input
              id="address-line2"
              type="text"
              placeholder="e.g. Near City Center Mall"
              {...register("shippingAddress.addressLine2")}
              className="w-full rounded-none border border-brand-border/80 bg-white px-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors"
            />
          </div>

          {/* Pincode, City, State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pincode with Indian PIN validation */}
            <div>
              <label htmlFor="address-pincode" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                PIN Code <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="address-pincode"
                  type="text"
                  maxLength={6}
                  autoComplete="postal-code"
                  placeholder="560001"
                  {...register("shippingAddress.pincode")}
                  className={`w-full rounded-none border px-3 py-2 pl-8 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                    errors.shippingAddress?.pincode
                      ? "border-red-500 bg-red-50/20"
                      : "border-brand-border/80 bg-white"
                  }`}
                />
                <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-brand-dark/40" />
              </div>
              {errors.shippingAddress?.pincode && (
                <p className="mt-1 text-[11px] text-red-600">{errors.shippingAddress.pincode.message}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label htmlFor="address-city" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                City / District <span className="text-red-600">*</span>
              </label>
              <input
                id="address-city"
                type="text"
                autoComplete="address-level2"
                placeholder="Bengaluru"
                {...register("shippingAddress.city")}
                className={`w-full rounded-none border px-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                  errors.shippingAddress?.city
                    ? "border-red-500 bg-red-50/20"
                    : "border-brand-border/80 bg-white"
                }`}
              />
              {errors.shippingAddress?.city && (
                <p className="mt-1 text-[11px] text-red-600">{errors.shippingAddress.city.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label htmlFor="address-state" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                State <span className="text-red-600">*</span>
              </label>
              <select
                id="address-state"
                autoComplete="address-level1"
                {...register("shippingAddress.state")}
                className={`w-full rounded-none border px-3 py-2 text-xs text-brand-dark bg-white focus:border-brand-dark focus:outline-none transition-colors ${
                  errors.shippingAddress?.state
                    ? "border-red-500 bg-red-50/20"
                    : "border-brand-border/80"
                }`}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.shippingAddress?.state && (
                <p className="mt-1 text-[11px] text-red-600">{errors.shippingAddress.state.message}</p>
              )}
            </div>
          </div>

          {/* Address Type & Save Option */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Address Type
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-brand-dark cursor-pointer">
                  <input
                    type="radio"
                    value="home"
                    {...register("shippingAddress.addressType")}
                    className="text-brand-dark focus:ring-brand-accent"
                  />
                  <span>Home (All day)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-brand-dark cursor-pointer">
                  <input
                    type="radio"
                    value="work"
                    {...register("shippingAddress.addressType")}
                    className="text-brand-dark focus:ring-brand-accent"
                  />
                  <span>Work (10 AM - 6 PM)</span>
                </label>
              </div>
            </div>

            {/* Save Address Checkbox for logged in users */}
            {isLoggedIn && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("shippingAddress.saveAddress")}
                  className="h-4 w-4 rounded border-brand-border text-brand-dark focus:ring-brand-accent"
                />
                <span className="text-xs text-brand-dark/80">Save this address to my profile</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
