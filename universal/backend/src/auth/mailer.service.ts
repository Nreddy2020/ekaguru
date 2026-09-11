import { Injectable, Logger } from "@nestjs/common";

export interface OutboundMail {
  to: string;
  subject: string;
  text: string;
}

/**
 * Minimal server-side mail boundary.
 * Production configures AUTH_MAIL_WEBHOOK_URL (a trusted delivery service that accepts
 * JSON {to, subject, text}); development logs a notice without the message body.
 * In tests the outbox is retained so flows can be verified without a network.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  readonly outbox: OutboundMail[] = [];

  get configured() {
    return Boolean(process.env.AUTH_MAIL_WEBHOOK_URL?.trim());
  }

  async deliver(mail: OutboundMail): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      this.outbox.push(mail);
      return;
    }
    const url = process.env.AUTH_MAIL_WEBHOOK_URL?.trim();
    if (!url) {
      // Never print the token-bearing body; operators must configure delivery.
      this.logger.warn(
        "Mail delivery is not configured (AUTH_MAIL_WEBHOOK_URL). A message for " +
          mail.to.replace(/(.).+(@.*)/, "$1***$2") +
          " with subject '" +
          mail.subject +
          "' was not sent.",
      );
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AUTH_MAIL_WEBHOOK_TOKEN
            ? { Authorization: "Bearer " + process.env.AUTH_MAIL_WEBHOOK_TOKEN }
            : {}),
        },
        body: JSON.stringify(mail),
      });
      if (!response.ok)
        throw new Error("Mail webhook responded " + response.status);
    } catch (error: any) {
      this.logger.error("Mail delivery failed: " + (error?.message || error));
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
