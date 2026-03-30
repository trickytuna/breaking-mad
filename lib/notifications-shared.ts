export type NotificationChannel = "email" | "sms";
export type NotificationSubscriberStatus = "active" | "unsubscribed";

export interface SiteSubscriber {
  id: string;
  channel: NotificationChannel;
  contact_value: string;
  email: string;
  phone: string;
  status: NotificationSubscriberStatus;
  unsubscribe_token: string;
  confirmed_at: string;
  created_at: string;
  updated_at: string;
}

export function normalizeEmailAddress(input: string) {
  return input.trim().toLowerCase();
}

export function normalizePhoneNumber(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    const normalized = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : "";
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return "";
}

export function formatChannelLabel(channel: NotificationChannel) {
  return channel === "sms" ? "text message" : "email";
}
