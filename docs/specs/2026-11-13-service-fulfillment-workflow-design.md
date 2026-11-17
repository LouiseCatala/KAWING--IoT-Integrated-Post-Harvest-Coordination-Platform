# Service Fulfillment Workflow Design

## Intent

Use a first-provider-wins service lifecycle that cannot be fulfilled by an unrelated provider.

## Workflow

- `pending`: visible in Available Jobs and unassigned.
- `matched`: hidden from Available Jobs, assigned to exactly one provider, visible in both parties' active/accepted views.
- Provider cancellation: `matched → pending`, clears assignment and acceptance time, notifies the farmer, and returns the request to Available Jobs.
- Provider fulfillment: `matched → completed`, stores `completedAt`, removes it from active/accepted views, shows it in Completed, and notifies the farmer by web and email.
- Only the assigned provider may cancel or fulfill.
- Completed services allow one immutable 1–5 star rating from each participant to the other.

## UI

- Buyer Service Bookings shows **Cancel** beside **Mark Fulfilled** for matched bookings.
- Farmer My Service Requests adds **Completed** beside Accepted Services.
- Completed cards expose mutual transaction rating controls.

## Data

- Service lifecycle timestamps and assignment stay in `service_requests.data`.
- Service ratings use a dedicated `service_ratings` database table linked to `service_request_id`.

## Approach

Keep the existing single-assignment service-request model and harden its transitions. A multi-provider application table was rejected after the workflow was clarified as first-provider-wins.

