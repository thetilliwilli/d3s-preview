import { Telegraf } from "telegraf";

export class TelegramBot {
  
  private static bots: { [token: string]: Telegraf } = {};

  public static async getSharedInstance(token: string): Promise<Telegraf> {
    if (!this.bots[token]) {
      this.bots[token] = new Telegraf(token);
      // hack: https://github.com/telegraf/telegraf/issues/1749
      /* await  */this.bots[token].launch();
    }
    return this.bots[token];
  }
}
