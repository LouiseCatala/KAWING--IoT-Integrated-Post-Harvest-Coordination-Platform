# Service Request View Design

## Intent

Help a farmer separate every request they posted from requests already accepted by a buyer or service provider.

## Approved Design

- Add two compact buttons to **My Service Requests**: **Posted Requests** and **Accepted Services**.
- **Posted Requests** is the default and shows every request owned by the signed-in farmer.
- **Accepted Services** shows only requests whose status is `matched`.
- Keep the existing request cards, workflow, stored data, and backend unchanged.

## Approaches Considered

- **Inline view buttons (selected):** fastest to scan and keeps both views on the same page.
- Separate sidebar page: rejected because it duplicates navigation for the same request data.

