import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  signAdminSession
} from "@/lib/auth/session";
import { badRequest, serverError } from "@/lib/api/json";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const password = body?.password;

    if (typeof password !== "string") {
      return badRequest("Password is required", { password: "Password is required" });
    }

    if (!process.env.ADMIN_PASSWORD) {
      return serverError("ADMIN_PASSWORD is not configured");
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      console.log(password, process.env.ADMIN_PASSWORD)
      return badRequest("Invalid credentials", { password: "Incorrect password" });
    }

    const token = await signAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return response;
  } catch (e) {
    console.log({ e })
    return serverError();
  }
}
