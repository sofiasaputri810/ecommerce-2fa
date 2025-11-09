// app/api/2fa/setup/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `E-Commerce (${session.user.email})`
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Store secret temporarily (user must verify before enabling)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("user_profiles")
    .update({ two_factor_secret: secret.base32 })
    .eq("id", session.user.id);

  return NextResponse.json({
    secret: secret.base32,
    qrCode: qrCodeUrl
  });
}