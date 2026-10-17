export type Department = 'fashion' | 'furniture';
export type Role = 'owner' | 'manager' | 'sales';

export type ProductImage = { url: string; alt: string; kind?: 'studio' | 'room' };

export type Variant = {
  id: string;
  product_id: string;
  size: string;
  colour: string;
  barcode: string;
  stock: number;
  low_stock_at: number;
  sort: number;
};

export type Product = {
  id: string;
  slug: string;
  department: Department;
  category: string;
  name: string;
  description: string;
  details: string;
  care: string;
  price: number;
  images: ProductImage[];
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  materials: string;
  finishes: string;
  availability: 'ready' | 'made_to_order';
  lead_time_weeks: number | null;
  allow_deposit: boolean;
  is_new: boolean;
  published: boolean;
  created_at: string;
  variants: Variant[];
};

export type OrderStatus = 'awaiting_payment' | 'received' | 'preparing' | 'sent' | 'delivered' | 'collected' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';
export type PaymentMethod = 'paystack' | 'cash' | 'transfer' | 'pos_card';
export type Channel = 'online' | 'counter' | 'showroom';

export type OrderItem = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  department: Department;
  name: string;
  size: string;
  colour: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  number: string;
  channel: Channel;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  customer_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  fulfilment: 'delivery' | 'collection' | 'in_store';
  zone_id: string | null;
  zone_name: string;
  address: string;
  gift_message: string;
  is_gift: boolean;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  amount_paid: number;
  pay_deposit: boolean;
  staff_id: string | null;
  staff_name?: string | null;
  note: string;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  items: OrderItem[];
};

export type DeliveryZone = {
  id: string;
  name: string;
  fashion_fee: number;
  furniture_fee: number;
  active: boolean;
  sort: number;
};

export type StoreSettings = {
  storeName: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  depositPercent: number;
  reserveMinutes: number;
  receiptFooter: string;
};

export type CartLine = { variantId: string; qty: number };
