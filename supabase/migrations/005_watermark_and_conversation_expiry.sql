-- Watermark: shown by default, Pro+ plans can hide it
ALTER TABLE clients
ADD COLUMN show_watermark BOOLEAN NOT NULL DEFAULT true;

-- Conversation expiry in hours (null = never expire, default 24h)
ALTER TABLE clients
ADD COLUMN conversation_expiry_hours INTEGER DEFAULT 24;
