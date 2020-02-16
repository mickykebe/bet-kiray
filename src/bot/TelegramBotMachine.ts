import { Machine, State, StateMachine, interpret, assign } from "xstate";
import { TelegramBot } from "./TelegramBot";
import Yup from "yup";
import { Message as TelegramMessage } from "../types/telegram";
import * as db from "../db";
import { redis } from "../redis";
import { HouseType, HouseAvailableFor } from "../utils/values";
import {
  houseAvailabilityValidator,
  houseTypeValidator
} from "../utils/validation";

const MESSAGE_START = "/start";
const MESSAGE_BACK_TO_MAIN_MENU = "🔚 Main Menu";
const MESSAGE_POST_HOUSE = "🏠 Post a house";

enum MESSAGES_AVAILABLE_FOR {
  Sale = "💰 Sale",
  Rent = "👛 Rent"
}

const AVAILABLE_FOR_MAP = {
  [MESSAGES_AVAILABLE_FOR.Sale]: HouseAvailableFor.Sale,
  [MESSAGES_AVAILABLE_FOR.Rent]: HouseAvailableFor.Rent
};

enum MESSAGES_HOUSE_TYPE {
  Apartment = "🏨 Apartment",
  Condominium = "🏢 Condominium",
  House = "🏠 House",
  CommercialProperty = "🏪 Commercial Property",
  HouseRooms = "🚪 House Room(s)",
  GuestHouse = "🏘️ Guest House"
}

const HOUSE_TYPE_MAP = {
  [MESSAGES_HOUSE_TYPE.Apartment]: HouseType.Apartment,
  [MESSAGES_HOUSE_TYPE.Condominium]: HouseType.Condominium,
  [MESSAGES_HOUSE_TYPE.House]: HouseType.House,
  [MESSAGES_HOUSE_TYPE.CommercialProperty]: HouseType.CommercialProperty,
  [MESSAGES_HOUSE_TYPE.HouseRooms]: HouseType.HouseRooms,
  [MESSAGES_HOUSE_TYPE.GuestHouse]: HouseType.GuestHouse
};

const resolveMessageEvent = (messageText: string) => (
  _context: Context,
  event: Events
) => {
  return (
    event.type === "RECEIVED_MESSAGE" && event.message.text === messageText
  );
};

const resetListingValue = (field: keyof ListingValues) =>
  assign<Context>({
    listingValues: (context): ListingValues => ({
      ...context.listingValues,
      [field]: undefined
    })
  });

const saveListingValue = (field: keyof ListingValues) =>
  assign<Context, Events>({
    listingValues: (context, event): ListingValues => {
      const messageEvent = event as EVENT_RECEIVED_MESSAGE;
      return {
        ...context.listingValues,
        [field]: messageEvent.message.text
      };
    }
  });

function yupEventValidator<T extends Yup.MixedSchema>(
  validator: T,
  transformer: (text: string) => string = text => text
) {
  return (_context: Context, event: Events): boolean => {
    const messageEvent = event as EVENT_RECEIVED_MESSAGE;
    const text = messageEvent.message.text;
    return !!text && validator.isValidSync(transformer(text));
  };
}

interface StateSchema {
  states: {
    promptMainMenu: {};
    waitingMainReply: {};
    postingHouse: {
      states: {
        promptHouseAvailability: {};
        waitingHouseAvailability: {};
        promptHouseType: {};
        waitingHouseType: {};
        promptRooms: {};
      };
    };
  };
}

type EVENT_START = { type: "START" };
type EVENT_BACK_TO_MAIN_MENU = { type: "BACK_TO_MAIN_MENU" };
type EVENT_RECEIVED_MESSAGE = {
  type: "RECEIVED_MESSAGE";
  message: TelegramMessage;
};

type Events = EVENT_START | EVENT_BACK_TO_MAIN_MENU | EVENT_RECEIVED_MESSAGE;

interface ListingValues {
  availability?: string;
  houseType?: string;
}

interface Context {
  telegramUserId: number;
  userId: number;
  listingValues: ListingValues;
}

export class TelegramBotMachine {
  private machine: StateMachine<Context, StateSchema, Events>;
  constructor(private telegramBot: TelegramBot) {
    this.machine = Machine<Context, StateSchema, Events>(
      {
        id: "botMachine",
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
          waitingMainReply: {
            on: {
              START: {
                target: "promptMainMenu"
              },
              RECEIVED_MESSAGE: [
                {
                  cond: "isEventPostJob",
                  target: "postingHouse"
                }
              ]
            }
          },
          postingHouse: {
            initial: "promptHouseAvailability",
            on: {
              START: {
                target: "promptMainMenu"
              },
              BACK_TO_MAIN_MENU: {
                target: "promptMainMenu"
              }
            },
            states: {
              promptHouseAvailability: {
                invoke: {
                  id: "promptHouseAvailability",
                  src: "promptHouseAvailability",
                  onDone: {
                    target: "waitingHouseAvailability"
                  }
                }
              },
              waitingHouseAvailability: {
                entry: ["resetAvailability"],
                on: {
                  RECEIVED_MESSAGE: {
                    target: "promptHouseType",
                    actions: ["saveAvailability"],
                    cond: { type: "availabilityValid" }
                  }
                }
              },
              promptHouseType: {
                invoke: {
                  id: "promptHouseType",
                  src: "promptHouseType",
                  onDone: {
                    target: "waitingHouseType"
                  }
                }
              },
              waitingHouseType: {
                entry: ["resetHouseType"],
                on: {
                  RECEIVED_MESSAGE: {
                    target: "promptRooms",
                    actions: ["saveHouseType"],
                    cond: { type: "houseTypeValid" }
                  }
                }
              },
              promptRooms: {}
            }
          }
        }
      },
      {
        guards: {
          isEventPostJob: resolveMessageEvent(MESSAGE_POST_HOUSE),
          availabilityValid: yupEventValidator(
            houseAvailabilityValidator,
            (text: string) => AVAILABLE_FOR_MAP[text as MESSAGES_AVAILABLE_FOR]
          ),
          houseTypeValid: yupEventValidator(
            houseTypeValidator,
            (text: string) => HOUSE_TYPE_MAP[text as MESSAGES_HOUSE_TYPE]
          )
        },
        actions: {
          resetAvailability: resetListingValue("availability"),
          saveAvailability: saveListingValue("availability"),
          resetHouseType: resetListingValue("houseType"),
          saveHouseType: saveListingValue("houseType")
        },
        services: {
          promptMainMenu: this.promptMainMenu,
          promptHouseAvailability: this.promptHouseAvailability,
          promptHouseType: this.promptHouseType
        }
      }
    );
  }

  run = async (message: TelegramMessage) => {
    const telegramUser = message.from;
    if (!telegramUser) {
      return;
    }
    let botMachine = this.machine;
    let previousState = await this.getPersistedMachineState(telegramUser.id);
    let currentState;
    if (previousState) {
      currentState = botMachine.resolveState(previousState);
    } else {
      const user = await db.findOrCreateTelegramUser(telegramUser, "user");
      botMachine = this.machine.withContext({
        ...this.machine.context,
        userId: user.id,
        telegramUserId: telegramUser.id,
        listingValues: {}
      });
      currentState = botMachine.initialState;
    }
    const service = interpret(botMachine);
    service.onTransition(state => {
      if (state.changed) {
        this.persistMachineState(telegramUser.id, state);
      }
    });
    service.start(currentState);
    if (message.text === MESSAGE_START) {
      service.send({ type: "START" });
    } else if (message.text === MESSAGE_BACK_TO_MAIN_MENU) {
      service.send({ type: "BACK_TO_MAIN_MENU" });
    } else {
      service.send({ type: "RECEIVED_MESSAGE", message });
    }
  };

  private promptMainMenu = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      "Choose an option",
      {
        replyMarkup: {
          keyboard: [[{ text: MESSAGE_POST_HOUSE }]],
          resize_keyboard: true
        }
      }
    );
  };

  private promptHouseAvailability = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      "Is the house available for sale or rent?",
      {
        replyMarkup: {
          keyboard: [
            [
              { text: MESSAGES_AVAILABLE_FOR.Sale },
              { text: MESSAGES_AVAILABLE_FOR.Rent }
            ]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptHouseType = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      "Choose the type of house.",
      {
        replyMarkup: {
          keyboard: [
            [
              { text: MESSAGES_HOUSE_TYPE.HouseRooms },
              { text: MESSAGES_HOUSE_TYPE.Condominium }
            ],
            [
              { text: MESSAGES_HOUSE_TYPE.Apartment },
              { text: MESSAGES_HOUSE_TYPE.House }
            ],
            [
              { text: MESSAGES_HOUSE_TYPE.GuestHouse },
              { text: MESSAGES_HOUSE_TYPE.CommercialProperty }
            ]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private getPersistedMachineState = async (
    telegramUserId: number
  ): Promise<State<Context, Events> | void> => {
    let rawState = await redis.get(`telegram_user_${telegramUserId}`);
    if (rawState) {
      return State.create(JSON.parse(rawState));
    }
  };

  private persistMachineState = async (
    telegramUserId: number,
    state: State<Context, Events>
  ): Promise<string> => {
    return redis.set(
      `telegram_user_${telegramUserId}`,
      JSON.stringify(state),
      "ex",
      24 * 60 * 60
    );
  };
}
