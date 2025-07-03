import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    console.log("👉 Input received:", input);

    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        { response: "No input provided." },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API key");
    }

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: input }],
        },
      ],
    };

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("👉 Gemini raw response:", data);

    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!output) {
      return NextResponse.json(
        { response: "No valid response from Gemini." },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: output });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Internal Error:", err.message);
    } else {
      console.error("❌ Unknown error:", err);
    }
    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500 }
    );
  }
}
