import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentSection } from "@/lib/site-content-shared";
import {
  formatChannelLabel,
  type NotificationChannel,
} from "@/lib/notifications-shared";

type NotificationPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  section: ContentSection;
};

type SubscriberRow = {
  id: string;
  channel: NotificationChannel;
  email: string;
  phone: string;
  unsubscribe_token: string;
};

export function getNotificationConfigState() {
  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "";
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const twilioMessagingServiceSid =
    process.env.TWILIO_MESSAGING_SERVICE_SID ?? "";
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER ?? "";

  return {
    emailConfigured: Boolean(resendApiKey && resendFromEmail),
    smsConfigured: Boolean(
      twilioAccountSid &&
        twilioAuthToken &&
        (twilioMessagingServiceSid || twilioPhoneNumber)
    ),
  };
}

function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, "");
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (productionUrl) {
    return `https://${productionUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  const deploymentUrl = process.env.VERCEL_URL?.trim();

  if (deploymentUrl) {
    return `https://${deploymentUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

function getSectionLabel(section: ContentSection) {
  return section === "work" ? "work" : "journal entry";
}

function buildPostUrl(post: NotificationPost) {
  return `${getSiteUrl()}/${post.section}/${post.slug}`;
}

function buildUnsubscribeUrl(token: string) {
  return `${getSiteUrl()}/notify/unsubscribe?token=${token}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailPayload(post: NotificationPost, unsubscribeToken: string) {
  const sectionLabel = getSectionLabel(post.section);
  const postUrl = buildPostUrl(post);
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);
  const subject = `New ${sectionLabel} on Breaking Mad: ${post.title}`;

  const html = [
    `<h1 style="font-family:Arial,sans-serif;font-size:28px;line-height:1.2;margin:0 0 16px;">${escapeHtml(post.title)}</h1>`,
    `<p style="font-family:Arial,sans-serif;font-size:16px;line-height:1.7;margin:0 0 18px;">${escapeHtml(post.excerpt)}</p>`,
    `<p style="font-family:Arial,sans-serif;font-size:16px;line-height:1.7;margin:0 0 24px;"><a href="${postUrl}" style="color:#22d3ee;font-weight:700;">Read it on Breaking Mad</a></p>`,
    `<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#71717a;margin:24px 0 0;">You subscribed to new publication alerts from Breaking Mad. <a href="${unsubscribeUrl}" style="color:#71717a;">Unsubscribe</a>.</p>`,
  ].join("");

  const text = [
    `New ${sectionLabel} on Breaking Mad`,
    "",
    post.title,
    post.excerpt,
    "",
    `Read it: ${postUrl}`,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return {
    subject,
    html,
    text,
    unsubscribeUrl,
  };
}

async function sendEmailNotification(
  subscriber: SubscriberRow,
  post: NotificationPost
) {
  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "";

  if (!resendApiKey || !resendFromEmail || !subscriber.email) {
    throw new Error("Email notifications are not fully configured.");
  }

  const payload = buildEmailPayload(post, subscriber.unsubscribe_token);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [subscriber.email],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: {
        "List-Unsubscribe": `<${payload.unsubscribeUrl}>`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Email delivery failed.");
  }

  const data = (await response.json()) as { id?: string };
  return data.id ?? "";
}

function buildSmsBody(post: NotificationPost) {
  return `Breaking Mad: new ${getSectionLabel(post.section)} live - ${post.title}. ${buildPostUrl(post)} Reply STOP to unsubscribe.`;
}

async function sendSmsNotification(
  subscriber: SubscriberRow,
  post: NotificationPost
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID ?? "";
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER ?? "";

  if (
    !accountSid ||
    !authToken ||
    (!messagingServiceSid && !twilioPhoneNumber) ||
    !subscriber.phone
  ) {
    throw new Error("SMS notifications are not fully configured.");
  }

  const body = new URLSearchParams({
    To: subscriber.phone,
    Body: buildSmsBody(post),
    ...(messagingServiceSid
      ? {
          MessagingServiceSid: messagingServiceSid,
        }
      : {
          From: twilioPhoneNumber,
        }),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "SMS delivery failed.");
  }

  const data = (await response.json()) as { sid?: string };
  return data.sid ?? "";
}

export async function sendPostNotifications(
  supabase: SupabaseClient,
  post: NotificationPost
) {
  const subscriberResult = await supabase
    .from("site_subscribers")
    .select("id, channel, email, phone, unsubscribe_token")
    .eq("status", "active");

  if (
    subscriberResult.error?.code === "42P01" ||
    subscriberResult.error?.code === "PGRST205"
  ) {
    return {
      status: "pending" as const,
      sentCount: 0,
      issueCount: 0,
      skippedChannels: ["email", "sms"] as NotificationChannel[],
    };
  }

  if (subscriberResult.error) {
    return {
      status: "issue" as const,
      sentCount: 0,
      issueCount: 1,
      skippedChannels: [] as NotificationChannel[],
    };
  }

  const subscribers = (subscriberResult.data ?? []) as SubscriberRow[];

  if (!subscribers.length) {
    return {
      status: "sent" as const,
      sentCount: 0,
      issueCount: 0,
      skippedChannels: [] as NotificationChannel[],
    };
  }

  const deliveryResult = await supabase
    .from("site_notification_deliveries")
    .select("subscriber_id")
    .eq("post_id", post.id);

  if (
    deliveryResult.error?.code === "42P01" ||
    deliveryResult.error?.code === "PGRST205"
  ) {
    return {
      status: "pending" as const,
      sentCount: 0,
      issueCount: 0,
      skippedChannels: ["email", "sms"] as NotificationChannel[],
    };
  }

  if (deliveryResult.error) {
    return {
      status: "issue" as const,
      sentCount: 0,
      issueCount: 1,
      skippedChannels: [] as NotificationChannel[],
    };
  }

  const deliveredSubscriberIds = new Set(
    (deliveryResult.data ?? []).map((delivery) => String(delivery.subscriber_id))
  );
  const config = getNotificationConfigState();
  const skippedChannels = new Set<NotificationChannel>();
  let sentCount = 0;
  let issueCount = 0;

  for (const subscriber of subscribers) {
    if (deliveredSubscriberIds.has(subscriber.id)) {
      continue;
    }

    try {
      let providerMessageId = "";

      if (subscriber.channel === "email") {
        if (!config.emailConfigured) {
          skippedChannels.add("email");
          continue;
        }

        providerMessageId = await sendEmailNotification(subscriber, post);
      } else {
        if (!config.smsConfigured) {
          skippedChannels.add("sms");
          continue;
        }

        providerMessageId = await sendSmsNotification(subscriber, post);
      }

      const { error: insertError } = await supabase
        .from("site_notification_deliveries")
        .insert({
          post_id: post.id,
          subscriber_id: subscriber.id,
          channel: subscriber.channel,
          status: "sent",
          provider_message_id: providerMessageId,
          error_message: "",
        });

      if (insertError && insertError.code !== "23505") {
        issueCount += 1;
        continue;
      }

      sentCount += 1;
    } catch {
      issueCount += 1;
    }
  }

  if (issueCount > 0) {
    return {
      status: "issue" as const,
      sentCount,
      issueCount,
      skippedChannels: Array.from(skippedChannels),
    };
  }

  if (skippedChannels.size > 0) {
    return {
      status: "pending" as const,
      sentCount,
      issueCount: 0,
      skippedChannels: Array.from(skippedChannels),
    };
  }

  return {
    status: "sent" as const,
    sentCount,
    issueCount: 0,
    skippedChannels: [] as NotificationChannel[],
  };
}

export function describeSkippedChannels(channels: NotificationChannel[]) {
  if (!channels.length) {
    return "";
  }

  return channels.map(formatChannelLabel).join(" and ");
}
