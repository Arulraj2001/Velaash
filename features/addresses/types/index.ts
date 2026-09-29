import { z } from "zod";

/**
 * Indian 6-digit PIN code regex: starts with digits 1-9 followed by 5 digits
 */
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Indian 10-digit mobile number regex (starts with 6, 7, 8, 9)
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export const INDIAN_STATES = [
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
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export type AddressType = "home" | "work" | "other";

export const CustomerAddressFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  addressLine1: z.string().trim().min(5, "Address line 1 must be at least 5 characters"),
  addressLine2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(2, "City must be at least 2 characters"),
  state: z.string().trim().min(2, "Please select or enter your state"),
  pincode: z
    .string()
    .trim()
    .regex(INDIAN_PINCODE_REGEX, "Please enter a valid 6-digit Indian PIN code (e.g. 560001)"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().optional().default(false),
});

export type CustomerAddressFormData = z.infer<typeof CustomerAddressFormSchema>;

export interface SavedCustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressActionResult {
  success: boolean;
  error?: string;
  address?: SavedCustomerAddress;
  newDefaultId?: string;
}
