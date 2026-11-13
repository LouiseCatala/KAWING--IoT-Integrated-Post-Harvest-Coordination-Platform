# Multiple Coordination Contacts Design

## Intent

KAWING coordinates farmers, buyers, service providers, and loan providers; it does not conduct their payments or off-platform transactions. Once both sides are officially coordinated, KAWING must reveal reliable contact details so they can communicate directly.

## Contact Data

- Keep `contactNumber` as the required primary number for backward compatibility.
- Add `additionalContactNumbers: string[]` to user profiles.
- The Edit Profile form includes a `+ Add another contact number` control.
- Each additional number has its own field and Remove control.
- Empty and duplicate numbers are removed or rejected before saving.
- The profile API stores the array as structured database data.
- Existing accounts without the new field continue to work normally.

## Privacy and Visibility

- Public listings and browsing screens do not reveal private contact information.
- Contact details become visible only when users are coordinated:
  - Harvest: a farmer accepts a buyer's price offer.
  - Service: a provider accepts a farmer's service request.
  - Loan: a lender approves a farmer's loan request.
- Coordinated views show the relevant party's email, primary number, and every saved additional number.
- Cancelled, declined, open, and merely viewed records do not reveal new contact details.
- Completed records retain contact details because they are transaction history for an already coordinated pair.

## Coordinated Screens

- Farmer accepted-deal cards show the accepted buyer's contact numbers and email.
- Buyer accepted-offer cards show the farmer's contact numbers and email.
- Farmer accepted-service cards show the service provider's contact numbers and email.
- Provider service-booking cards show the farmer's contact numbers and email.
- Farmer approved-loan records show the lender's contact numbers and email.
- Lender approved-loan records show the farmer's contact numbers and email.

## Approaches Considered

1. Store a dynamic array of additional numbers while preserving the primary number. Selected because it supports multiple contacts, remains backward compatible, and avoids parsing formatted text.
2. Store exactly one secondary number. Rejected because it would require another schema/UI change if users need more contacts.
3. Store comma-separated numbers in the existing field. Rejected because validation, phone links, deduplication, and database querying would be unreliable.

## Constraints

- Do not add payments, checkout, escrow, or transaction processing.
- Do not change acceptance, matching, loan approval, fulfillment, cancellation, or rating workflows.
- Do not reveal contacts before coordination.
- Server responses and UI visibility must enforce the same privacy rule; hiding data only with CSS is insufficient.

## Verification

- Save, reload, edit, and remove multiple contact numbers.
- Confirm empty and duplicate values are not stored.
- Confirm contacts remain hidden in all open/public records.
- Confirm email and every contact number appear for both coordinated parties in accepted harvest, matched service, and approved loan records.
- Confirm contact visibility persists after reload and in completed history.
- Run role-separated Playwright sessions and inspect API/network responses for privacy leaks.
