-- Widget customization: glow effect, greeting tooltip, custom icon, logo

ALTER TABLE clients ADD COLUMN bubble_icon_url text;
ALTER TABLE clients ADD COLUMN logo_url text;
ALTER TABLE clients ADD COLUMN greeting_message text;
ALTER TABLE clients ADD COLUMN glow_effect boolean NOT NULL DEFAULT false;
