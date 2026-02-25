-- Widget customization: single JSONB column for extensible appearance config
-- New keys can be added without migrations.
-- Known keys: bubbleIconUrl, logoUrl, greetingMessage, glowEffect

ALTER TABLE clients ADD COLUMN customization jsonb NOT NULL DEFAULT '{}';
