import { NextRequest, NextResponse } from "next/server";

// This is a server-only API route that will handle authentication requests
// without trying to bundle bcrypt with client-side code

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // Forward the request to your actual API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

  try {
    const response = await fetch(`${apiUrl}/auth/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error in auth/${action}:`, error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 500 },
    );
  }
}

// Make sure this route is always server-side rendered
export const dynamic = "force-dynamic";
