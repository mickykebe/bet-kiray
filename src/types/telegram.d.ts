export interface Update {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  channel_post?: Message;
  edited_channel_post?: Message;
  inline_query?: any;
  chosen_inline_result?: any;
  callback_query?: CallbackQuery;
  shipping_query?: any;
  pre_checkout_query?: any;
  poll?: any;
  poll_answer?: any;
}

export interface CallbackQuery {
  id: string;
  from: User;
  message?: Message;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

export interface Message {
  message_id: number;
  from?: User;
  date: number;
  chat: any;
  forward_form?: User;
}

export interface User {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}
