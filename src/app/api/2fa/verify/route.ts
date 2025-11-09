// app/api/2fa/verify/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import speakeasy from "speakeasy";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user's secret
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("two_factor_secret")
    .eq("id", session.user.id)
    .single();

  if (!profile?.two_factor_secret) {
    return NextResponse.json({ error: "2FA not set up" }, { status: 400 });
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: profile.two_factor_secret,
    encoding: "base32",
    token: token,
    window: 2
  });

  if (verified) {
    // Enable 2FA
    await supabase
      .from("user_profiles")
      .update({ two_factor_enabled: true })
      .eq("id", session.user.id);

    // Log the event
    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "2fa_enabled",
      details: { success: true }
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 400 });
}