export interface User {
  id: number;
  telegram_id: number;
  telegram_user_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface HouseListing {
  id: number;
  available_for: string;
  house_type: string;
  title: string;
  description?: string;
  rooms?: number;
  bathrooms?: number;
  price?: string;
  location?: string;
  owner: number;
  approval_status: string;
  created: Date;
  photos?: string[];
  apply_via_telegram?: boolean;
  apply_phone_number?: string;
}
