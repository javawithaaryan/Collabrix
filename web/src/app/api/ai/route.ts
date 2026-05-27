import { NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are Collabrix, an engineering workflow assistant for a collaborative developer platform.
You help developers summarize Kanban tasks, generate code snippets, explain technical concepts, and suggest workflow improvements.
Respond concisely, keep answers actionable, and align recommendations with modern React, Tailwind CSS, and Zustand patterns when applicable.`

type ApiRequestBody = {
  prompt: string
  history?: Array<{
    role: string
    content: string
  }>
}

function buildMessages(history?: ApiRequestBody["history"], prompt?: string) {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ]

  if (history && Array.isArray(history)) {
    history.forEach((item) => {
      if (item.role && item.content) {
        messages.push({ role: item.role, content: item.content })
      }
    })
  }

  if (prompt) {
    messages.push({ role: "user", content: prompt })
  }

  return messages
}

export async function POST(request: Request) {
  const body = (await request.json()) as ApiRequestBody

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid prompt in request body." },
      { status: 400 },
    )
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    )
  }

  const chatMessages = buildMessages(body.history, body.prompt)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.25,
      max_tokens: 700,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json(
      { error: `AI provider error: ${errorText}` },
      { status: response.status },
    )
  }

  const data = await response.json()
  const aiMessage = data?.choices?.[0]?.message?.content

  return NextResponse.json({
    message:
      typeof aiMessage === "string"
        ? aiMessage.trim()
        : "The AI did not return a valid response.",
  })
}
