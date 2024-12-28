import { AbstractMessage } from "../message/abstract-message";

export abstract class AbstractRequest extends AbstractMessage {
  public type = this.constructor.name;
}
