export type Role = 'CUSTOMER' | 'ADMIN' | 'DRIVER';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_AT_LOCATION'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  pricePerKg: number;
  stockKg: number;
  imageUrl?: string;
  isAvailable: boolean;
  category?: Category;
}

export interface Address {
  id: string;
  label: string;
  streetAddress: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryInstructions?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  weightKg: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  driverId?: string;
  driver?: {
    fullName: string;
    phone: string;
  };
  shippingAddress: Address;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  otpCode?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  token?: string;
}

