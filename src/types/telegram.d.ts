export interface UnsuccessfulResponse {
  ok: false;
  description?: string;
  error_code: number;
}

type TelegramResult = File | boolean | Message | Message[];

export interface SuccessfulResponse {
  ok: true;
  result: TelegramResult;
}

type Response = SuccessfulResponse | UnsuccessfulResponse;

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
  forward_from_chat?: any;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  forward_date?: number;
  reply_to_message?: Message;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: any[];
  caption_entities?: any[];
  audio?: any;
  document?: any;
  animation?: any;
  game?: any;
  photo?: PhotoSize[];
  sticker?: any;
  video?: any;
  voice?: any;
  video_note?: any;
  contact?: Contact;
}

export interface Contact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface PhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface File {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
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

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  selective?: boolean;
}

export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
  request_poll?: KeyboardButtonPollType;
}

export interface KeyboardButtonPollType {
  type?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  login_url?: LoginUrl;
  callback_data?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  callback_game?: any;
  pay?: boolean;
}

export interface LoginUrl {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access: boolean;
}

export interface InputMediaPhoto {
  type: "photo";
  media: string;
  caption?: string;
  parse_mode?: "Markdown" | "HTML";
}

export interface InputMediaVideo {
  type: "video";
  media: string;
  thumb?: string;
  caption?: string;
  parse_mode?: string;
  width?: number;
  height?: number;
  duration?: number;
  supports_streaming?: boolean;
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true;
  selective?: boolean;
}

export interface ForceReply {
  force_reply: true;
  selective?: boolean;
}
