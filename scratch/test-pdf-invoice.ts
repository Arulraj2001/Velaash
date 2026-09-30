import { generateInvoicePdfBuffer } from "../features/admin/services/invoice-pdf";
import type { AdminOrderDetail } from "../features/admin/types/orders";

const mockOrder: AdminOrderDetail = {
  id: "test-order-1",
  orderNumber: "ORD-2026-9999",
  status: "confirmed",
  paymentMethod: "razorpay",
  paymentStatus: "paid",
  subtotal: 2499,
  shippingCharge: 0,
  discountAmount: 200,
  totalAmount: 2299,
  couponCode: "SAVE200",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  shippingAddress: {
    fullName: "Arul Raj",
    phone: "+91 9876543210",
    email: "arul@example.com",
    addressLine1: "123 Boutique Street",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
  },
  items: [
    {
      id: "item-1",
      productName: "Silk Embroidered Anarkali Kurta",
      size: "M",
      color: "Dusty Rose",
      sku: "VEL-ARK-M-ROSE",
      unitPrice: 2499,
      quantity: 1,
      subtotal: 2499,
    },
  ],
  statusHistory: [],
  canCancel: true,
  canRefund: false,
};

async function main() {
  console.log("Testing invoice generation (GST disabled / Bill of Supply)...");
  const pdfBuffer1 = await generateInvoicePdfBuffer(mockOrder, false);
  console.log("Bill of Supply generated, bytes:", pdfBuffer1.length);

  console.log("Testing invoice generation (GST enabled / Tax Invoice)...");
  const pdfBuffer2 = await generateInvoicePdfBuffer(mockOrder, true, "33ABCDE1234F1Z5");
  console.log("Tax Invoice generated, bytes:", pdfBuffer2.length);
}

main().catch(console.error);
