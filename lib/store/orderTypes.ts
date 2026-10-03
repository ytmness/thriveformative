export type StoreReceiptLine = {
  name: string;
  variationName: string | null;
  quantity: number;
  unitAmount: number;
  currency: string;
};

export type StoreReceiptData = {
  folio: string;
  paidAt: string;
  recipientName: string;
  fulfillment: "pickup" | "shipping";
  locationName: string | null;
  address: string | null;
  currency: string;
  totalAmount: number;
  lines: StoreReceiptLine[];
  locale: string;
};
