# PalaySense input mode

User approved replacing database reading history with a Wi-Fi input for Post Harvest and Offer Harvest.

1. Preserve the POST endpoint, validate device API key and farmer identity, relay one temporary latest reading per farmer outside the database.
2. Require authenticated farmer reads; poll only while the harvest form is open, abort on close, and accept fresh readings only.
3. Keep final harvest moisture persistence. Remove sensor history tables from new-install schemas; preserve existing historical records pending explicit cleanup.
4. Document firmware configuration and check isolation, overwrite, expiry, PHP syntax and TypeScript compilation.

Limit: this is a single-server temporary relay, suitable for the current PHP hosting. Firmware is external; it must include farmerEmail and x-api-key. No claim of physical device testing.
