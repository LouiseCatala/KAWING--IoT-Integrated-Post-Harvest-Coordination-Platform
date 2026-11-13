# Service Request Edit and Delete Design

## Intent

Make Posted Requests describe only the farmer's original service request and let the farmer correct or remove requests that have not entered a transaction.

## Behavior

- Remove the accepted provider's name from cards in Posted Requests.
- Show Edit and Delete only for open requests owned by the signed-in farmer.
- Edit reuses the existing service-request form, prefilled with the saved database values, and asks for confirmation before saving.
- Delete asks for confirmation before permanently removing the request.
- Accepted or completed requests cannot be edited or deleted.
- A locked accepted request displays `With pending transaction` so the farmer understands why its actions are unavailable.
- Updates and deletions must be confirmed by the server before the interface treats them as saved.

## Constraints

- Do not change the service-request matching, cancellation, fulfillment, notification, or rating workflow.
- Do not allow farmers to change ownership, status, provider assignment, acceptance dates, completion dates, or other transaction-controlled fields through editing.
- Completed records remain available as transaction history and stay locked.

## Approaches Considered

1. Reuse the current request form and confirmation system. This keeps validation and styling consistent and avoids duplicated request logic. **Selected.**
2. Build a separate edit form and separate dialogs. This offers more isolation but duplicates fields and increases the risk that create and edit behavior drift apart.

## Verification

- Confirm the Posted Requests card no longer shows the provider name.
- Confirm an open request can be edited and the changes survive reload.
- Confirm deleting an open request removes it after confirmation and survives reload.
- Confirm cancellation leaves the request open and editable again.
- Confirm accepted and completed requests cannot be edited or deleted.
- Confirm accepted requests show `With pending transaction`.
- Run lint, production build, and relevant workflow tests.
