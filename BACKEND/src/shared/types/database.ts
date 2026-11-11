// ==============================================================================
// lib/shared/types/database.ts
// Database types reflecting Supabase PostgreSQL Schema
// ==============================================================================

export type MeasurementUnit = 'inches' | 'cm';

export type UserRole = 'owner' | 'tailor' | 'staff';

export type OrderPriority = 'normal' | 'urgent';

export type OrderStatus = 
  | 'received'
  | 'cutting'
  | 'stitching'
  | 'finishing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer';

export type FabricSource = 'customer' | 'shop';

export type ExpenseCategory = 
  | 'fabric'
  | 'thread_accessories'
  | 'rent'
  | 'salary'
  | 'electricity'
  | 'repairs'
  | 'other';

export interface Shop {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  alternate_phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  currency: string;
  measurement_unit: MeasurementUnit;
  invoice_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  shop_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  alternate_phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface GarmentType {
  id: string;
  shop_id?: string | null;
  code: string;
  name: string;
  default_price: number;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface MeasurementFieldDef {
  id: string;
  shop_id?: string | null;
  garment_code: string;
  field_key: string;
  label_en: string;
  label_hi?: string | null;
  sort_order: number;
  is_custom: boolean;
  created_at: string;
}

export interface MeasurementProfile {
  id: string;
  shop_id: string;
  customer_id: string;
  garment_type: string;
  title: string;
  unit: MeasurementUnit;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  values?: MeasurementValue[];
}

export interface MeasurementValue {
  id?: string;
  profile_id?: string;
  field_key: string;
  value: number;
  fraction?: string; // e.g., '1/4', '1/2', '3/4'
  notes?: string | null;
}

export interface Worker {
  id: string;
  shop_id: string;
  name: string;
  phone?: string | null;
  specialty: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  shop_id: string;
  customer_id: string;
  order_number: string;
  order_date: string;
  trial_date?: string | null;
  delivery_date: string;
  priority: OrderPriority;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined fields
  customer?: Customer;
  items?: OrderItem[];
  payments?: Payment[];
  status_history?: OrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  garment_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  design_notes?: string | null;
  fabric_source: FabricSource;
  fabric_details?: string | null;
  measurement_profile_id?: string | null;
  assigned_worker_id?: string | null;
  reference_photos: string[];
  created_at: string;
  // Joined fields
  worker?: Worker | null;
  measurement_profile?: MeasurementProfile | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: string | null;
  to_status: string;
  changed_by?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  shop_id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_mode: PaymentMode;
  transaction_ref?: string | null;
  notes?: string | null;
  created_at: string;
  // Joined fields
  order?: {
    order_number: string;
  };
}

export interface Expense {
  id: string;
  shop_id: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  paid_to?: string | null;
  payment_mode: PaymentMode;
  notes?: string | null;
  created_at: string;
}

export interface ShopSettings {
  id: string;
  shop_id: string;
  whatsapp_template_order_confirm?: string | null;
  whatsapp_template_trial_ready?: string | null;
  whatsapp_template_delivery_ready?: string | null;
  whatsapp_template_payment_reminder?: string | null;
  terms_and_conditions?: string | null;
  updated_at: string;
}

export interface CustomerSummaryView {
  customer_id: string;
  shop_id: string;
  name: string;
  phone: string;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_billed: number;
  total_paid: number;
  balance_due: number;
}
