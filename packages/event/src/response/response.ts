import { InboundSignalResponse } from "./inbound-signal-response";
import { OutboundSignalResponse } from "./outbound-signal-response";
import { StateResponse } from "./state-response";

export const response = {
  StateResponse,
  InboundSignalResponse,
  OutboundSignalResponse,
};

export type ResponseTypes = {
  [ctr in keyof typeof response]: InstanceType<typeof response[ctr]>;
};