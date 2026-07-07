import { NextResponse } from "next/server";
import { callOpenAIInterpret } from "@/lib/ai/openaiClient";
import type { AIInterpretRequest } from "@/lib/ai/types";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 100_000;
const VALID_SCOPES = new Set(["natal", "decade", "year", "month", "day", "hour"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRequestBody(body: unknown): body is AIInterpretRequest {
  if (!isRecord(body)) {
    return false;
  }

  if (typeof body.title !== "string" || !VALID_SCOPES.has(String(body.scope))) {
    return false;
  }

  if (!isRecord(body.birthInfo) || !isRecord(body.selectedTime)) {
    return false;
  }

  if (!Array.isArray(body.mainPalaces) || body.mainPalaces.length > 8) {
    return false;
  }

  if (!Array.isArray(body.signals) || body.signals.length > 60) {
    return false;
  }

  if (!isRecord(body.ruleInterpretation)) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: "AI 解读输入过大" }, { status: 413 });
    }

    const body = JSON.parse(rawBody) as unknown;

    if (!validateRequestBody(body)) {
      return NextResponse.json({ error: "AI 解读输入格式不正确" }, { status: 400 });
    }

    const interpretation = await callOpenAIInterpret(body);

    return NextResponse.json(interpretation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 解读生成失败";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
