import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeEmailAddress,
  normalizePhoneNumber,
} from "@/lib/notifications-shared";

function readBoolean(value: unknown) {
  return value === true;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      phone?: string;
      wantsEmail?: boolean;
      wantsSms?: boolean;
      consent?: boolean;
    };

    const wantsEmail = readBoolean(body.wantsEmail);
    const wantsSms = readBoolean(body.wantsSms);
    const email = normalizeEmailAddress(body.email ?? "");
    const phone = normalizePhoneNumber(body.phone ?? "");
    const consent = readBoolean(body.consent);

    if (!consent) {
      return NextResponse.json(
        {
          error:
            "Please confirm that you want to receive publication alerts before subscribing.",
        },
        { status: 400 }
      );
    }

    if (!wantsEmail && !wantsSms) {
      return NextResponse.json(
        {
          error: "Choose at least one alert type: email or text message.",
        },
        { status: 400 }
      );
    }

    if (wantsEmail && !email) {
      return NextResponse.json(
        {
          error: "Enter a valid email address to receive email alerts.",
        },
        { status: 400 }
      );
    }

    if (wantsSms && !phone) {
      return NextResponse.json(
        {
          error:
            "Enter a mobile number in US or E.164 format to receive text alerts.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (wantsEmail) {
      const { error } = await supabase.rpc("register_site_subscriber", {
        target_channel: "email",
        target_contact_value: email,
        target_email: email,
        target_phone: "",
      });

      if (error) {
        const status =
          error.code === "42883" || error.code === "42P01" ? 503 : 500;
        return NextResponse.json(
          {
            error:
              status === 503
                ? "Notification subscriptions are not fully set up yet."
                : "Could not save your email subscription.",
          },
          { status }
        );
      }
    }

    if (wantsSms) {
      const { error } = await supabase.rpc("register_site_subscriber", {
        target_channel: "sms",
        target_contact_value: phone,
        target_email: "",
        target_phone: phone,
      });

      if (error) {
        const status =
          error.code === "42883" || error.code === "42P01" ? 503 : 500;
        return NextResponse.json(
          {
            error:
              status === 503
                ? "Notification subscriptions are not fully set up yet."
                : "Could not save your text subscription.",
          },
          { status }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "You are on the list. New work and journal releases will land by the channels you selected.",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Something went wrong while saving your notification settings.",
      },
      { status: 500 }
    );
  }
}
