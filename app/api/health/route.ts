import { NextResponse } from "next/server";
import { supabaseConfigured, stripeConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    services: {
      supabase: supabaseConfigured,
      stripe: stripeConfigured,
    },
    version: "0.1.0",
  });
}
