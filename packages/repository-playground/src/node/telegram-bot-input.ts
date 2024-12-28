import { NodeBuilder } from "@d3s/runtime";
import { message } from "telegraf/filters";
import { TelegramBot } from "../service/telegram-bot.js";

const bot = Symbol("bot");

export const telegramBotInput = new NodeBuilder()
  // .withState({
  //   [bot]: undefined as Telegraf | undefined,
  // })
  .withInput({
    token: "",
    start: null,
  })
  .withOutput({ message: "" })
  .withHandlers({
    async start({ state, input, signal, instance, emit }) {
      instance[bot] = await TelegramBot.getSharedInstance(input.token);
      instance[bot]?.on(message("text"), async (ctx:any) => {
        emit("message", ctx.message.text);
      });
    },
  });
