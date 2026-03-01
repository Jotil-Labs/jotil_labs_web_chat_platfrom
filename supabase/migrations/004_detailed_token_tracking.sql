-- Add prompt_tokens and completion_tokens columns for cost analytics
-- tokens_used (total) is kept for backward compatibility
ALTER TABLE messages
ADD COLUMN prompt_tokens INTEGER DEFAULT NULL,
ADD COLUMN completion_tokens INTEGER DEFAULT NULL;
