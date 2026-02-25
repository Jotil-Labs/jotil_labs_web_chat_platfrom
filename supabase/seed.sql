-- Seed data for local development

-- Test client: Test Coffee Shop
insert into clients (id, name, domain, bot_name, welcome_message, system_prompt, ai_model, primary_color, border_radius, position, document_context, plan, message_limit, messages_used, active, bubble_icon_url, logo_url, greeting_message, glow_effect)
values (
  '00000000-0000-0000-0000-000000000001',
  'Test Coffee Shop',
  'localhost',
  'Coffee Bot',
  'Welcome to Test Coffee Shop! How can I help you today?',
  'You are the AI assistant for Test Coffee Shop. You help visitors with questions about our coffee, menu, hours, and locations.

About the business:
Test Coffee Shop is a cozy neighborhood coffee shop serving specialty coffee, pastries, and light lunch items. We roast our own beans in-house and pride ourselves on friendly service.

Menu highlights:
- Espresso drinks (latte, cappuccino, americano, mocha)
- Drip coffee (house blend, single origin rotating)
- Cold brew and iced drinks
- Pastries (croissants, muffins, scones)
- Sandwiches and salads

Business hours:
Monday through Friday: 6:00 AM to 6:00 PM
Saturday and Sunday: 7:00 AM to 5:00 PM

Location:
456 Oak Avenue, Portland, OR 97201

Contact:
- Phone: (503) 555-0199
- Email: hello@testcoffeeshop.com

Tone: Warm and friendly, like a neighborhood barista.',
  'openai/gpt-5-nano',
  '#7C3AED',
  12,
  'bottom-right',
  'Our most popular drink is the Lavender Oat Milk Latte ($5.50). We offer free Wi-Fi. Dogs are welcome on our patio. We have a loyalty program - buy 10 drinks, get one free. We accept all major credit cards and mobile payments. Parking is available on the street and in the lot behind the building.',
  'starter',
  2000,
  42,
  true,
  null,
  null,
  'Hi there! Need help finding the perfect coffee?',
  true
);

-- Seed conversation
insert into conversations (id, client_id, visitor_id, started_at, last_message_at)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'seed-visitor-001',
  now() - interval '1 hour',
  now() - interval '5 minutes'
);

-- Seed messages
insert into messages (conversation_id, role, content, model_used, tokens_used, created_at) values
(
  '00000000-0000-0000-0000-000000000010',
  'user',
  'What are your hours?',
  null,
  null,
  now() - interval '1 hour'
),
(
  '00000000-0000-0000-0000-000000000010',
  'assistant',
  'We''re open **Monday through Friday** from 6:00 AM to 6:00 PM, and **Saturday and Sunday** from 7:00 AM to 5:00 PM. Is there anything else I can help you with?',
  'openai/gpt-5-nano',
  48,
  now() - interval '59 minutes'
),
(
  '00000000-0000-0000-0000-000000000010',
  'user',
  'Do you have oat milk?',
  null,
  null,
  now() - interval '30 minutes'
),
(
  '00000000-0000-0000-0000-000000000010',
  'assistant',
  'Yes! We have oat milk available as an alternative for any of our espresso drinks. In fact, our **Lavender Oat Milk Latte** ($5.50) is one of our most popular drinks. Would you like to know more about our menu?',
  'openai/gpt-5-nano',
  52,
  now() - interval '29 minutes'
),
(
  '00000000-0000-0000-0000-000000000010',
  'user',
  'Is there parking nearby?',
  null,
  null,
  now() - interval '10 minutes'
),
(
  '00000000-0000-0000-0000-000000000010',
  'assistant',
  'Yes, parking is available in two spots:\n\n- **Street parking** directly in front of the shop\n- **Parking lot** behind the building\n\nBoth options are free for customers. Let me know if you need directions!',
  'openai/gpt-5-nano',
  45,
  now() - interval '9 minutes'
);
