const MOCK_RESPONSES = [
  `Thanks for reaching out! Here's what I can help you with:

**Our most popular items:**
- Lavender Oat Milk Latte ($5.50)
- House Blend Drip Coffee ($3.00)
- Fresh-baked croissants ($3.50)

We also have *seasonal specials* that change monthly. Right now we're featuring a **Maple Pecan Cold Brew** that's been getting great reviews.

You can find our full menu on our website, or feel free to ask me about anything specific. Is there something in particular you're looking for?`,

  `Great question! We have a wide selection of **fresh juices** and smoothies:

- Orange Juice (fresh-squeezed) — $4.50
- Green Detox (kale, apple, ginger) — $5.50
- Berry Blast Smoothie — $6.00
- Mango Lassi — $5.00

All juices are made to order with *no added sugar*. We can also customize any drink to your preference. Would you like to try one?`,

  `Absolutely! Here's some info about our **hours and location**:

We're open **Monday–Friday** from 7:00 AM to 7:00 PM, and **weekends** from 8:00 AM to 5:00 PM.

You'll find us at *123 Main Street*, right across from the park. There's free parking in the back lot.

Is there anything else I can help you with?`,

  `That's a great choice! Let me share some details:

We pride ourselves on sourcing **ethically traded, single-origin beans** from small farms around the world. Our current rotation includes:

1. *Ethiopian Yirgacheffe* — bright, fruity notes
2. *Colombian Supremo* — rich, nutty flavor
3. *Sumatra Mandheling* — earthy, full-bodied

Each bag is roasted fresh weekly right here in our shop. Would you like to know about our brewing methods?`,

  `Sure thing! Here are our **pastry options** available today:

| Item | Price |
|------|-------|
| Butter Croissant | $3.50 |
| Almond Danish | $4.00 |
| Blueberry Muffin | $3.25 |
| Cinnamon Roll | $4.50 |

Everything is baked fresh each morning by our in-house baker. We also have *gluten-free* options — just ask at the counter!`,
];

function selectResponse(message: string): string {
  // Simple hash of message to pick a response deterministically
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash + message.charCodeAt(i)) | 0;
  }
  return MOCK_RESPONSES[Math.abs(hash) % MOCK_RESPONSES.length];
}

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function createMockStreamResponse(message: string): { response: Response; text: string } {
  const text = selectResponse(message);
  const tokens = text.split(/(?<=\s)|(?=\s)/);
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

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'x-vercel-ai-ui-message-stream': 'v1',
    },
  });

  return { response, text };
}
