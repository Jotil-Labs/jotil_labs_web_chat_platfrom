const MOCK_RESPONSE = `Thanks for reaching out! Here's what I can help you with:

**Our most popular items:**
- Lavender Oat Milk Latte ($5.50)
- House Blend Drip Coffee ($3.00)
- Fresh-baked croissants ($3.50)

We also have *seasonal specials* that change monthly. Right now we're featuring a **Maple Pecan Cold Brew** that's been getting great reviews.

You can find our full menu on our website, or feel free to ask me about anything specific. Is there something in particular you're looking for?`;

function encodeToken(token: string): string {
  return `0:${JSON.stringify(token)}\n`;
}

export function createMockStreamResponse(): Response {
  const tokens = MOCK_RESPONSE.split(/(?<=\s)|(?=\s)/);
  let index = 0;

  const stream = new ReadableStream({
    async pull(controller) {
      if (index < tokens.length) {
        const token = tokens[index++];
        controller.enqueue(new TextEncoder().encode(encodeToken(token)));
        await new Promise((resolve) =>
          setTimeout(resolve, 30 + Math.random() * 20)
        );
      } else {
        const finishData = {
          finishReason: 'stop',
          usage: { promptTokens: 150, completionTokens: 85 },
        };
        controller.enqueue(
          new TextEncoder().encode(`d:${JSON.stringify(finishData)}\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
