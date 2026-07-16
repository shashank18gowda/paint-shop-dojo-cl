import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class BrevoEmailService {
  private readonly logger = new Logger(BrevoEmailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY', '');
    this.senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL', '');
    this.senderName = this.config.get<string>('BREVO_SENDER_NAME', 'Paint Shop Dojo');
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const recipients = input.to.map((t) => t.email).join(', ');

    if (!this.apiKey || !this.senderEmail) {
      const error = 'Brevo is not configured (missing BREVO_API_KEY / BREVO_SENDER_EMAIL)';
      this.logger.error(`Cannot send email to ${recipients}: ${error}`);
      return { success: false, error };
    }

    const body = {
      sender: { name: this.senderName, email: this.senderEmail },
      to: input.to,
      subject: input.subject,
      htmlContent: input.html,
      ...(input.attachments?.length
        ? {
            attachment: input.attachments.map((a) => ({
              name: a.filename,
              content: a.content.toString('base64'),
            })),
          }
        : {}),
    };

    try {
      const res = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        const error = `Brevo API error ${res.status}: ${text}`;
        this.logger.error(`Failed to send email to ${recipients}: ${error}`);
        return { success: false, error };
      }

      const data = (await res.json()) as { messageId?: string };
      this.logger.log(`Email sent to ${recipients} (subject: "${input.subject}", messageId: ${data.messageId ?? 'n/a'})`);
      return { success: true, messageId: data.messageId };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${recipients}: ${error}`);
      return { success: false, error };
    }
  }
}
