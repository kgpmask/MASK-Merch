export const storeConfig = {
  upiId: process.env.UPI_ID ?? "replace-me@upi",
  upiRecipientName: process.env.UPI_RECIPIENT_NAME ?? "MASK PAYMENT RECIPIENT",
  upiQrImageUrl: process.env.UPI_QR_IMAGE_URL ?? "/assets/store/upi-placeholder.svg",
  contactEmail: process.env.NEXT_PUBLIC_MASK_CONTACT_EMAIL ?? "replace-with-mask-contact@example.com",
  contactInstagram: process.env.NEXT_PUBLIC_MASK_CONTACT_INSTAGRAM ?? "https://www.instagram.com/maskiitkgp",
  maxProofBytes: Number(process.env.MAX_PAYMENT_PROOF_BYTES ?? 5_242_880),
} as const;

export function formatMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export const garmentLabels = {
  normal_tshirt: "Normal T-shirt",
  oversized_tshirt: "Oversized T-shirt",
  hoodie: "Hoodie",
} as const;
