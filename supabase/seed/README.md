# Database seed data

This repository does not currently include production product seed data. Do not treat demo products, placeholder image URLs, or sample prices as real inventory.

## Local development

1. Configure the Supabase project and environment variables.
2. Apply migrations in order.
3. Add categories and clothing products through the authenticated store-admin interface.
4. Upload real product imagery to the configured storage bucket before publishing.

Never load fabricated products into production. Keep historical migrations intact; schema changes must be delivered as new migrations so existing customer and order data is preserved.
