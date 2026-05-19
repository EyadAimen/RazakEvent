# Clubs API

Base URL: `http://localhost:5000/api`

All requests that require authentication must include:
```
Authorization: Bearer <token>
```

---

## GET /api/clubs

Returns all clubs. Used to populate dropdowns (e.g. sign-up club selection, lead role request).

**Auth:** Any logged-in user

**Response 200**
```json
{
  "clubs": [
    {
      "id": 1,
      "name": "Chess Club",
      "type": "club",
      "description": "Weekly chess sessions and tournaments.",
      "leadId": "uuid-of-lead",
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

---

## GET /api/clubs/requests

List all club creation requests. Supports filtering and search.

**Auth:** Admin only

**Query params**

| Param | Values | Default |
|-------|--------|---------|
| `status` | `pending` \| `approved` \| `rejected` \| `all` | `all` |
| `search` | any string | — |

`search` matches against club name or student full name.

**Response 200**
```json
{
  "requests": [
    {
      "id": 3,
      "clubName": "Photography Club",
      "clubType": "club",
      "description": "A club for photography enthusiasts.",
      "status": "pending",
      "adminComment": null,
      "submittedAt": "2025-03-01T10:00:00.000Z",
      "reviewedAt": null,
      "student": {
        "id": "uuid-of-student",
        "fullName": "Ahmad Hafiz Bin Rashid",
        "staffOrMatricId": "A23CS0099"
      }
    }
  ]
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not an admin |

---

## GET /api/clubs/requests/:requestId

Get full detail for a single club creation request.

**Auth:** Admin only

**Response 200**
```json
{
  "request": {
    "id": 3,
    "clubName": "Photography Club",
    "clubType": "club",
    "description": "A club for photography enthusiasts.",
    "status": "pending",
    "adminComment": null,
    "submittedAt": "2025-03-01T10:00:00.000Z",
    "reviewedAt": null,
    "resultClubId": null,
    "student": {
      "id": "uuid-of-student",
      "fullName": "Ahmad Hafiz Bin Rashid",
      "staffOrMatricId": "A23CS0099",
      "email": "hafiz@graduate.utm.my"
    }
  }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not an admin |
| 404 | Request ID does not exist |

---

## PATCH /api/clubs/requests/:requestId/decision

Approve or reject a pending club creation request.

**Auth:** Admin only

**Request body**
```json
{
  "action": "approved",
  "adminComment": "Looks good!"
}
```

| Field | Type | Required |
|-------|------|----------|
| `action` | `"approved"` \| `"rejected"` | Yes |
| `adminComment` | string | Required when `action` is `"rejected"`, optional otherwise |

**Response 200 — approved**
```json
{ "message": "Club request approved" }
```

**Response 200 — rejected**
```json
{ "message": "Club request rejected" }
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `action` is `"rejected"` but `adminComment` is missing |
| 401 | No token or invalid token |
| 403 | Authenticated user is not an admin |
| 404 | Request ID does not exist |
| 409 | Request is not in `pending` status (already reviewed) |
| 409 | Student is already a lead of another club |
| 409 | A club with the same name already exists |

---

## Not yet implemented

The following endpoints are planned but not yet available:

- `POST /api/clubs/requests` — student submits a new club creation request
- `GET /api/clubs/requests/mine` — student views their own request status
