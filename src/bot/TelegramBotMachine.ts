import { Machine, State, StateMachine, interpret, assign } from "xstate";
import { TelegramBot } from "./TelegramBot";
import Yup from "yup";
import { Message as TelegramMessage } from "../types/telegram";
import * as db from "../db";
import { redis } from "../redis";
import { HouseType, HouseAvailableFor } from "../utils/values";
import * as validators from "../utils/validation";

const MAX_PHOTOS = 5;

const MESSAGE_START = "/start";
const MESSAGE_BACK_TO_MAIN_MENU = "🔚 ወደ ዋናው ማውጫ";
const MESSAGE_BACK = "⬅️ አንድ ወደ ኋላ";
const MESSAGE_SKIP = "➡️ ዝለል";
const MESSAGE_DONE = "✅ ጨርሻለሁ";
const MESSAGE_DROP_LISTING_PHOTOS = "🗑️ እስካሁን የላኳቸውን ፎቶዎች አጥፋ";
const MESSAGE_POST_HOUSE = "🏠 የቤት ማስታወቅያ ፍጠር";

enum MESSAGES_AVAILABLE_FOR {
  Sale = "💰 ሽያጭ",
  Rent = "👛 ኪራይ"
}

const AVAILABLE_FOR_MAP = {
  [MESSAGES_AVAILABLE_FOR.Sale]: HouseAvailableFor.Sale,
  [MESSAGES_AVAILABLE_FOR.Rent]: HouseAvailableFor.Rent
};

enum MESSAGES_HOUSE_TYPE {
  Apartment = "🏨 አፓርታማ",
  Condominium = "🏢 ኮንዶሚንየም",
  House = "🏠 ቤት",
  CommercialProperty = "🏪 የንግድ ቤት",
  HouseRooms = "🚪 የቤት ክፍሎች",
  GuestHouse = "🏘️ ጌስት ሃውስ"
}

const HOUSE_TYPE_MAP = {
  [MESSAGES_HOUSE_TYPE.Apartment]: HouseType.Apartment,
  [MESSAGES_HOUSE_TYPE.Condominium]: HouseType.Condominium,
  [MESSAGES_HOUSE_TYPE.House]: HouseType.House,
  [MESSAGES_HOUSE_TYPE.CommercialProperty]: HouseType.CommercialProperty,
  [MESSAGES_HOUSE_TYPE.HouseRooms]: HouseType.HouseRooms,
  [MESSAGES_HOUSE_TYPE.GuestHouse]: HouseType.GuestHouse
};

const messageGuard = (guard: (message: TelegramMessage) => boolean) => (
  _context: Context,
  event: Events
): boolean => {
  return event.type === "RECEIVED_MESSAGE" && guard(event.message);
};

const setListingValues = (
  setter: (
    currentValue: ListingValues,
    message: TelegramMessage
  ) => ListingValues
) =>
  assign<Context>({
    listingValues: (context, event) => {
      const messageEvent = event as EVENT_RECEIVED_MESSAGE;
      return setter(context.listingValues, messageEvent.message);
    }
  });

const resetListingValue = (field: keyof ListingValues) =>
  setListingValues(listingValue => {
    return {
      ...listingValue,
      [field]: undefined
    };
  });

const saveListingValue = <T>(
  field: keyof ListingValues,
  setter: (message: TelegramMessage, currentValue: ListingValues) => T
) =>
  setListingValues((listingValue, message) => {
    return {
      ...listingValue,
      [field]: setter(message, listingValue)
    };
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
        waitingRooms: {};
        promptBathrooms: {};
        waitingBathrooms: {};
        promptTitle: {};
        waitingTitle: {};
        promptDescription: {};
        waitingDescription: {};
        promptPrice: {};
        waitingPrice: {};
        promptPhotos: {};
        waitingPhoto: {};
        sendPhotoDropMessage: {};
        previewPost: {};
        waitingPreviewReply: {};
        savingPost: {};
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
  rooms?: number;
  bathrooms?: number;
  title?: string;
  description?: string;
  price?: string;
  photoFileIds?: string[];
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
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventBack",
                      target: "promptHouseAvailability"
                    },
                    {
                      target: "promptRooms",
                      actions: ["saveHouseType"],
                      cond: { type: "houseTypeValid" }
                    }
                  ]
                }
              },
              promptRooms: {
                invoke: {
                  id: "promptRooms",
                  src: "promptRooms",
                  onDone: {
                    target: "waitingRooms"
                  }
                }
              },
              waitingRooms: {
                entry: ["resetRooms"],
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventSkip",
                      target: "promptBathrooms"
                    },
                    {
                      cond: "isEventBack",
                      target: "promptHouseType"
                    },
                    {
                      target: "promptBathrooms",
                      actions: ["saveRooms"],
                      cond: { type: "roomsValid" }
                    }
                  ]
                }
              },
              promptBathrooms: {
                invoke: {
                  id: "promptBathrooms",
                  src: "promptBathrooms",
                  onDone: {
                    target: "waitingBathrooms"
                  }
                }
              },
              waitingBathrooms: {
                entry: ["resetBathrooms"],
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventSkip",
                      target: "promptTitle"
                    },
                    {
                      cond: "isEventBack",
                      target: "promptRooms"
                    },
                    {
                      target: "promptTitle",
                      actions: ["saveBathrooms"],
                      cond: { type: "bathroomsValid" }
                    }
                  ]
                }
              },
              promptTitle: {
                invoke: {
                  id: "promptTitle",
                  src: "promptTitle",
                  onDone: "waitingTitle"
                }
              },
              waitingTitle: {
                entry: ["resetTitle"],
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventBack",
                      target: "promptBathrooms"
                    },
                    {
                      target: "promptDescription",
                      actions: ["saveTitle"],
                      cond: { type: "titleValid" }
                    }
                  ]
                }
              },
              promptDescription: {
                invoke: {
                  id: "promptDescription",
                  src: "promptDescription",
                  onDone: "waitingDescription"
                }
              },
              waitingDescription: {
                entry: ["resetDescription"],
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventBack",
                      target: "promptTitle"
                    },
                    {
                      cond: "isEventSkip",
                      target: "promptPrice"
                    },
                    {
                      actions: ["saveDescription"],
                      target: "promptPrice"
                    }
                  ]
                }
              },
              promptPrice: {
                invoke: {
                  id: "promptPrice",
                  src: "promptPrice",
                  onDone: "waitingPrice"
                }
              },
              waitingPrice: {
                entry: ["resetPrice"],
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventBack",
                      target: "promptDescription"
                    },
                    {
                      cond: "isEventSkip",
                      target: "promptPhotos"
                    },
                    {
                      actions: ["savePrice"],
                      target: "promptPhotos"
                    }
                  ]
                }
              },
              promptPhotos: {
                invoke: {
                  id: "promptPhotos",
                  src: "promptPhotos",
                  onDone: {
                    target: "waitingPhoto"
                  }
                }
              },
              waitingPhoto: {
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventBack",
                      target: "promptPrice"
                    },
                    {
                      cond: "isEventDone",
                      target: "previewPost"
                    },
                    {
                      cond: "isEventDropPhotos",
                      actions: ["resetPhotos"],
                      target: "sendPhotoDropMessage"
                    },
                    {
                      cond: "isEventPhoto",
                      target: "waitingPhoto",
                      actions: ["savePhoto"]
                    }
                  ]
                }
              },
              sendPhotoDropMessage: {
                invoke: {
                  id: "sendPhotoDropMessage",
                  src: "sendPhotoDropMessage",
                  onDone: {
                    target: "promptPhotos"
                  }
                }
              },
              previewPost: {
                invoke: {
                  id: "previewPost",
                  src: "previewPost",
                  onDone: {
                    target: "waitingPreviewReply"
                  }
                }
              },
              waitingPreviewReply: {
                on: {
                  RECEIVED_MESSAGE: [
                    {
                      cond: "isEventBack",
                      target: "promptPhotos"
                    },
                    {
                      cond: "isEventDone",
                      target: "savingPost"
                    }
                  ]
                }
              },
              savingPost: {}
            }
          }
        }
      },
      {
        guards: {
          isEventBack: messageGuard(message => message.text === MESSAGE_BACK),
          isEventSkip: messageGuard(message => message.text === MESSAGE_SKIP),
          isEventDone: messageGuard(message => message.text === MESSAGE_DONE),
          isEventPostJob: messageGuard(
            message => message.text === MESSAGE_POST_HOUSE
          ),
          isEventPhoto: messageGuard(
            message => !!message.photo && message.photo.length > 0
          ),
          isEventDropPhotos: messageGuard(
            message => message.text === MESSAGE_DROP_LISTING_PHOTOS
          ),
          availabilityValid: yupEventValidator(
            validators.houseAvailabilityValidator,
            (text: string) => AVAILABLE_FOR_MAP[text as MESSAGES_AVAILABLE_FOR]
          ),
          houseTypeValid: yupEventValidator(
            validators.houseTypeValidator,
            (text: string) => {
              return HOUSE_TYPE_MAP[text as MESSAGES_HOUSE_TYPE];
            }
          ),
          roomsValid: yupEventValidator(validators.roomsValidator),
          bathroomsValid: yupEventValidator(validators.bathroomsValidator),
          titleValid: yupEventValidator(validators.titleValidator)
        },
        actions: {
          resetAvailability: resetListingValue("availability"),
          saveAvailability: saveListingValue<string>(
            "availability",
            message => {
              return AVAILABLE_FOR_MAP[message.text as MESSAGES_AVAILABLE_FOR];
            }
          ),
          resetHouseType: resetListingValue("houseType"),
          saveHouseType: saveListingValue<string>(
            "houseType",
            message => HOUSE_TYPE_MAP[message.text as MESSAGES_HOUSE_TYPE]
          ),
          resetRooms: resetListingValue("rooms"),
          saveRooms: saveListingValue<number>("rooms", message =>
            parseInt(message.text as string)
          ),
          resetBathrooms: resetListingValue("bathrooms"),
          saveBathrooms: saveListingValue<number>("bathrooms", message =>
            parseInt(message.text as string)
          ),
          resetTitle: resetListingValue("title"),
          saveTitle: saveListingValue<string>(
            "title",
            message => message.text as string
          ),
          resetDescription: resetListingValue("description"),
          saveDescription: saveListingValue<string>(
            "description",
            message => message.text as string
          ),
          resetPrice: resetListingValue("price"),
          savePrice: saveListingValue<string>(
            "price",
            message => message.text as string
          ),
          resetPhotos: resetListingValue("photoFileIds"),
          savePhoto: saveListingValue<string[]>(
            "photoFileIds",
            (message, listingValues) => {
              const fileIds = listingValues.photoFileIds || [];
              if (message.photo && message.photo.length > 0) {
                fileIds.push(message.photo[0].file_id);
              }
              return fileIds.slice(-MAX_PHOTOS);
            }
          )
        },
        services: {
          promptMainMenu: this.promptMainMenu,
          promptHouseAvailability: this.promptHouseAvailability,
          promptHouseType: this.promptHouseType,
          promptRooms: this.promptRooms,
          promptBathrooms: this.promptBathrooms,
          promptTitle: this.promptTitle,
          promptDescription: this.promptDescription,
          promptPrice: this.promptPrice,
          promptPhotos: this.promptPhotos,
          sendPhotoDropMessage: this.sendPhotoDropMessage,
          previewPost: this.previewPost
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
      "ከምርጫዎቹ አንዱን ምረጥ",
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
      "ማስታወቅያው ለቤት ኪራይ ነው ወይስ ለሽያጭ",
      {
        replyMarkup: {
          keyboard: [
            [
              { text: MESSAGES_AVAILABLE_FOR.Sale },
              { text: MESSAGES_AVAILABLE_FOR.Rent }
            ],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptHouseType = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      "የቤቱን አይነት ምረጥ",
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
            ],
            [{ text: MESSAGE_BACK }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptRooms = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      "ስንት ክፍል አለው? (ቁጥር ብቻ አስገባ)",
      {
        replyMarkup: {
          keyboard: [
            [{ text: MESSAGE_BACK }, { text: MESSAGE_SKIP }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptBathrooms = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      "ስንት ባኞ ቤት አለው? (ቁጥር ብቻ አስገባ)",
      {
        replyMarkup: {
          keyboard: [
            [{ text: MESSAGE_BACK }, { text: MESSAGE_SKIP }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptTitle = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      `ቤቱን በአንድ አረፍተነገር ግለጽ

_(ምሳሌ፦ "ጀሞ ሰፈር የሚከራይ ባለ አንድ መኝታ ቤት ኮንዶሚንየም)_`,
      {
        parseMode: "Markdown",
        replyMarkup: {
          keyboard: [
            [{ text: MESSAGE_BACK }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptDescription = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      `ስለ ቤቱ ሙሉ መግለጫ ስጥ፡፡ ስለ ቤቱ ገጽታ ዝርዝር ማብራርያ ስጥ`,
      {
        replyMarkup: {
          keyboard: [
            [{ text: MESSAGE_BACK }, { text: MESSAGE_SKIP }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private promptPrice = async (context: Context) => {
    await this.telegramBot.sendMessage(context.telegramUserId, `ዋጋ ስንት ነው?`, {
      replyMarkup: {
        keyboard: [
          [{ text: MESSAGE_BACK }, { text: MESSAGE_SKIP }],
          [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
        ],
        resize_keyboard: true
      }
    });
  };

  private promptPhotos = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      `የቤቱ ፎቶ ካለህ አሁን ላክልኝ፡፡ እስከ 5 ፎቶ መቀበል እችላለሁ፡፡

_(ፎቶ ከሌለህ ጨርሻለሁን ተጫን፡፡ )_`,
      {
        parseMode: "Markdown",
        replyMarkup: {
          keyboard: [
            [{ text: MESSAGE_BACK }, { text: MESSAGE_DONE }],
            [{ text: MESSAGE_DROP_LISTING_PHOTOS }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
          ],
          resize_keyboard: true
        }
      }
    );
  };

  private sendPhotoDropMessage = async (context: Context) => {
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      `ያስቀመጥካቸው ፎቶዎች ካሉ ጠፍተዋል፡፡`
    );
  };

  private previewPost = async (context: Context) => {
    const listing = context.listingValues;
    await this.telegramBot.sendMessage(
      context.telegramUserId,
      `*📝 Title:* \`\`\`${listing.title}\`\`\`

*🤝 Available For:* \`${listing.availability}\`

*🏘️ House Type:* \`${listing.houseType}\`${
        !!listing.price ? `\n\n*💲 Price:* \`\`\`${listing.price}\`\`\`` : ""
      }${
        !!listing.rooms ? `\n\n*🚪 Rooms:* \`\`\`${listing.rooms}\`\`\`` : ""
      }${
        !!listing.bathrooms
          ? `\n\n*🛁 Bathrooms:* \`\`\`${listing.bathrooms}\`\`\``
          : ""
      }${
        !!listing.description
          ? `\n\n*📜 Description:* \`\`\`${listing.description}\`\`\``
          : ""
      }
`,
      {
        parseMode: "Markdown",
        replyMarkup: {
          keyboard: [
            [{ text: MESSAGE_BACK }, { text: MESSAGE_DONE }],
            [{ text: MESSAGE_BACK_TO_MAIN_MENU }]
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
