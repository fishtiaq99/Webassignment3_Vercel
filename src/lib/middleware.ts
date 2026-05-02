import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, user: session.user as any };
}

export async function requireAdmin(request: NextRequest) {
  const { error, session, user } = await requireAuth(request);
  if (error) return { error };
  if (user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 }) };
  }
  return { session, user };
}

export function validateBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ""
  ) as string[];

  return { valid: missing.length === 0, missing };
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
