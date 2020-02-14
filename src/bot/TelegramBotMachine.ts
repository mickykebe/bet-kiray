import { Machine, State } from "xstate";
import { redis } from "../redis";

export interface TelegramStateSchema {
  states: {
    promptMainMenu: {};
    waitingMainReply: {};
  };
}

export type TelegramEvents =
  | { type: "START" }
  | { type: "RECEIVED_UPDATE" }
  | { type: "BACK_TO_MAIN_MENU" };

export interface TelegramContext {
  telegramUserId: number;
  userId: number;
}

export const machine = Machine<
  TelegramContext,
  TelegramStateSchema,
  TelegramEvents
>({
  id: "telegramBotMachine",
  initial: "promptMainMenu",
  states: {
    promptMainMenu: {
      invoke: {
        id: "promptMainMenu",
        src: "promptMainMenu",
        onDone: {
          target: "waitingMainReply"
        }
      }
    },
    waitingMainReply: {}
  }
});

export async function getPersistedMachineState(
  telegramUserId: number
): Promise<State<TelegramContext, TelegramEvents> | void> {
  let rawState = await redis.get(`telegram_user_${telegramUserId}`);
  if (rawState) {
    return State.create(JSON.parse(rawState));
  }
}

export async function persistMachineState(
  telegramUserId: number,
  state: State<TelegramContext, TelegramEvents>
): Promise<string> {
  return redis.set(
    `telegram_user_${telegramUserId}`,
    JSON.stringify(state),
    "ex",
    24 * 60 * 60
  );
}
