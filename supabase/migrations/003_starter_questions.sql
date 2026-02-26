-- Add starter_questions column to clients table
-- Stores an array of suggested questions shown to visitors when chat opens
-- Example: ["What services do you offer?", "What are your hours?", "How do I book?"]
ALTER TABLE clients
ADD COLUMN starter_questions JSONB DEFAULT NULL;
