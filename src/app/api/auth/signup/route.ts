import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { validateBody, apiError } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { valid, missing } = validateBody(body, ["name", "email", "password"]);

    if (!valid) {
      return apiError(`Missing required fields: ${missing?.join(", ")}`);
    }

    const { name, email, password, phone, role } = body;

    if (password.length < 6) {
      return apiError("Password must be at least 6 characters");
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return apiError("Email already registered", 409);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone,
      role: role === "admin" ? "admin" : "agent",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return apiError("Server error", 500);
  }
}
