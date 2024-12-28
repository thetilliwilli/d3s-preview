import { NodeBuilder } from "@d3s/runtime";
import nodemailer from "nodemailer";

export const mail = new NodeBuilder()
  .withInput({
    server: "smtp.example.com",
    port: 587,
    secure: false,
    requireTLS: true,
    ignoreCert: false,
    logger: false,
    debug: false,

    login: "",
    password: "",
    sender: "from@example.com",
    receivers: "to@example.com" as string | string[],
    subject: "",
    body: "",
    html: "index.html",
    attachments: "",

    send: null,
  })
  .withOutput({
    sent: null,
    success: {} as any,
    error: "",
  })
  .withHandlers({
    send({ input, signal, emit }) {
      const transport = nodemailer.createTransport({
        host: input.server,
        port: input.port,
        secure: input.secure,
        auth: {
          user: input.login,
          pass: input.password,
        },
        requireTLS: input.requireTLS,
        tls: {
          rejectUnauthorized: !input.ignoreCert,
        },
        logger: input.logger,
        debug: input.debug,
      });
      transport.sendMail(
        {
          from: input.sender,
          to: input.receivers,
          subject: input.subject,
          text: input.body,
          // html: { path: input.html },
          attachments: input.attachments === "" ? undefined : [{ path: input.attachments }],
        },
        (error, info) => {
          if (error) emit("error", error.message);
          else emit("success", info);
          emit("sent", null);
        }
      );
    },
  });
