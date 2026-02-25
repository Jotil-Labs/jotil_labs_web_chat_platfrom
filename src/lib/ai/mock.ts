export const MOCK_RESPONSE = `Thanks for reaching out! Here's what I can help you with:

**Our most popular items:**
- Lavender Oat Milk Latte ($5.50)
- House Blend Drip Coffee ($3.00)
- Fresh-baked croissants ($3.50)

We also have *seasonal specials* that change monthly. Right now we're featuring a **Maple Pecan Cold Brew** that's been getting great reviews.

You can find our full menu on our website, or feel free to ask me about anything specific. Is there something in particular you're looking for?`;

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function createMockStreamResponse(): Response {
  const tokens = MOCK_RESPONSE.split(/(?<=\s)|(?=\s)/);
  let index = 0;
  const messageId = `mock-${Date.now().toString(36)}`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Start event
      controller.enqueue(encoder.encode(sseEvent({ type: 'start', messageId })));

      // Stream tokens
      for (index = 0; index < tokens.length; index++) {
        controller.enqueue(
          encoder.encode(sseEvent({ type: 'text-delta', delta: tokens[index] }))
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 30 + Math.random() * 20)
        );
      }

      // Finish event
      controller.enqueue(
        encoder.encode(
          sseEvent({
            type: 'finish',
            finishReason: 'stop',
            usage: { promptTokens: 150, completionTokens: 85 },
          })
        )
      );

      // Done signal
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-ui-message-stream': 'v1',
    },
  });
}
