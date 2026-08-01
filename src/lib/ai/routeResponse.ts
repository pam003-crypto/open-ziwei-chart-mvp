import { NextResponse } from "next/server";

function getAllowedOrigins(): string[] {
  return (process.env.AI_ALLOWED_ORIGINS || process.env.AI_ALLOWED_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function getCorsHeaders(request: Request): HeadersInit {
  const requestOrigin = request.headers.get("origin")?.replace(/\/+$/, "");
  const allowedOrigins = getAllowedOrigins();

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": requestOrigin,
    Vary: "Origin",
  };
}

export function aiJsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: getCorsHeaders(request),
  });
}

export function aiOptionsResponse(request: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
