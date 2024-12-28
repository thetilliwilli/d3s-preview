import { AbstractMessage } from "../message/abstract-message";

export abstract class AbstractResponse extends AbstractMessage {
  public type = this.constructor.name;
}
