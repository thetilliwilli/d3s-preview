import { NodeBuilder } from "@d3s/runtime";
import { Input, Telegraf } from "telegraf";
import { TelegramBot } from "../service/telegram-bot.js";

const bot = Symbol("bot");

export const telegramBotOutput = new NodeBuilder()
  // .withState({
  //   [bot]: undefined as Telegraf | undefined,
  // })
  .withInput({
    token: "",
    message: "",
    chatId: "",
    photo: "",
    send: null,
    _init: null,
  })
  .withOutput({ message: "" })
  .withHandlers({
    async _init({ state, input, signal, instance, emit }) {
      if (input.token) instance[bot] = await TelegramBot.getSharedInstance(input.token);
    },
    async send({ state, input, signal, instance, emit }) {
      instance[bot] = await TelegramBot.getSharedInstance(input.token);
      if (input.photo !== "") {
        const photo = Input.fromLocalFile(input.photo);
        await instance[bot]?.telegram.sendPhoto(input.chatId, photo, { caption: input.message });
      } else {
        await instance[bot]?.telegram.sendMessage(input.chatId, input.message);
      }
    },
  });
