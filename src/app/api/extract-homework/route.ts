import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType || "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `이 사진은 학원 숙제 내용입니다. 사진에서 숙제 항목들을 추출해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:

{
  "academyName": "학원 이름 (알 수 없으면 빈 문자열)",
  "date": "숙제 날짜 YYYY-MM-DD 형식 (알 수 없으면 빈 문자열)",
  "note": "시험 종류나 메모 (예: Vocab Test, Grammar Test 등. 없으면 빈 문자열)",
  "items": ["숙제 항목 1", "숙제 항목 2", ...]
}

- 숙제 항목은 각각 한 줄로 작성
- 숙제와 관련 없는 내용(수업 내용, classwork 등)은 제외
- 항목이 여러 개면 배열로 나열`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "응답을 받지 못했습니다." },
        { status: 500 }
      );
    }

    // JSON 파싱 시도
    let parsed;
    try {
      // JSON 블록만 추출 (```json ... ``` 또는 순수 JSON)
      const jsonMatch =
        textBlock.text.match(/```json\s*([\s\S]*?)```/) ||
        textBlock.text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = JSON.parse(textBlock.text);
      }
    } catch {
      return NextResponse.json(
        { error: "응답 파싱에 실패했습니다.", raw: textBlock.text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Extract homework error:", error);
    return NextResponse.json(
      { error: "숙제 추출에 실패했습니다." },
      { status: 500 }
    );
  }
}
