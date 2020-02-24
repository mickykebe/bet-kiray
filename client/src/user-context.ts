import { createContext } from "react";

interface User {
  id: number;
  telegram_id: number;
  telegram_user_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export const UserContext = createContext<User | null>(null);
