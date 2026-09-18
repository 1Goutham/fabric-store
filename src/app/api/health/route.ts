import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ ok: true, db: mongoose.connection.readyState === 1 ? "connected" : "connecting" });
  } catch {
    return NextResponse.json({ ok: false, db: "unavailable" }, { status: 503 });
  }
}
