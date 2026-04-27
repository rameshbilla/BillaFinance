export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Upcoming' | 'Partially Paid';
export type BillingCycle = 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Yearly' | 'One-Time';

export interface BillProvider {
  id: string;
  name: string;
  category: string;
  officialUrl?: string;
  logo?: string;
}

export interface Bill {
  id?: string;
  title: string;
  category: string;
  providerName: string;
  consumerNumber: string;
  amountDue: number;
  dueDate: string;
  cycle: BillingCycle;
  status: BillStatus;
  location: string; // Telangana City
  notes?: string;
  attachmentUrl?: string;
  tags: string[]; // e.g., ['Home', 'Office']
  reminderEnabled: boolean;
  autoPay: boolean;
  createdBy: string; // Admin UID
  updatedAt: string;
}

export interface BillPayment {
  id?: string;
  billId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'NetBanking';
  notes?: string;
}

export const TELANGANA_CITIES = [
  'Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 
  'Khammam', 'Nalgonda', 'Mahabubnagar', 'Suryapet', 'Miryalaguda'
];

export const BILL_CATEGORIES = [
  'Electricity', 'Water', 'Internet', 'TV/DTH', 'Mobile', 
  'Gas', 'Rent', 'Apartment Maintenance', 'Insurance', 
  'EMI/Loan', 'OTT/Subscriptions', 'Education Fees', 
  'Groceries', 'Other'
];

export const DEFAULT_PROVIDERS: { [category: string]: string[] } = {
  'Electricity': ['TGSPDCL', 'TGNPDCL'],
  'Water': ['HMWSSB', 'Municipal/Local Board'],
  'Internet': ['ACT Fibernet', 'JioFiber', 'Airtel Xstream', 'BSNL', 'Hathway'],
  'TV/DTH': ['Tata Play', 'Airtel Digital TV', 'Dish TV', 'Sun Direct', 'DD Free Dish'],
  'Mobile': ['Airtel', 'Jio', 'Vi', 'BSNL'],
  'Gas': ['HP Gas', 'Indane', 'Bharat Gas', 'Piped Gas'],
};
