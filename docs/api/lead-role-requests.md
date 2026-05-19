# Lead Role Requests API

Base URL: `http://localhost:5000/api`

All requests that require authentication must include:
```
Authorization: Bearer <token>
```

---

## Status flow

```
Club has a leader:
  pending_lead  →  (lead approves)  →  pending_admin  →  (admin approves)  →  approved
  pending_lead  →  (lead rejects)   →  rejected

Leaderless club:
  pending_admin  →  (admin approves)  →  approved
  pending_admin  →  (admin rejects)   →  rejected
```

Once a request reaches `approved` or `rejected`, no further action can be taken on it.

---

## POST /api/requests/lead-role

Submit a request to become the lead of a club.

**Auth:** Member only

**Request body**
```json
{
  "clubId": 2
}
```

**Response 201**
```json
{
  "message": "Lead role request submitted",
  "requestId": 7
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `clubId` is missing or invalid |
| 401 | No token or invalid token |
| 403 | Authenticated user is not a member |
| 403 | User is not a member of the specified club |
| 404 | Club does not exist |
| 409 | User already has a pending request (pending_lead or pending_admin) |

---

## GET /api/requests/lead-role/mine

Get the authenticated member's own lead role request.

**Auth:** Member only

**Response 200 — request exists**
```json
{
  "request": {
    "id": 7,
    "clubId": 2,
    "status": "pending_lead",
    "leadComment": null,
    "adminComment": null,
    "submittedAt": "2025-04-01T09:00:00.000Z",
    "leadReviewedAt": null,
    "reviewedAt": null
  }
}
```

**Response 200 — no request**
```json
{
  "request": null
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not a member |

---

## GET /api/requests/lead-role/incoming

Get lead role requests directed at the authenticated lead's club.

**Auth:** Lead only

**Query params**

| Param | Values | Default |
|-------|--------|---------|
| `status` | `pending_lead` \| `all` | `pending_lead` |

**Response 200**
```json
{
  "requests": [
    {
      "id": 7,
      "status": "pending_lead",
      "submittedAt": "2025-04-01T09:00:00.000Z",
      "student": {
        "id": "uuid-of-student",
        "fullName": "Nurul Ain Binti Hamid",
        "staffOrMatricId": "A23CS0006"
      }
    }
  ]
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not a lead |

---

## GET /api/requests/lead-role

List all lead role requests. Supports filtering and search.

**Auth:** Admin only

**Query params**

| Param | Values | Default |
|-------|--------|---------|
| `status` | `pending_lead` \| `pending_admin` \| `approved` \| `rejected` \| `all` | `all` |
| `search` | any string | — |

**Response 200**
```json
{
  "requests": [
    {
      "id": 7,
      "status": "pending_admin",
      "submittedAt": "2025-04-01T09:00:00.000Z",
      "club": {
        "id": 2,
        "name": "Chess Club"
      },
      "student": {
        "id": "uuid-of-student",
        "fullName": "Nurul Ain Binti Hamid",
        "staffOrMatricId": "A23CS0006"
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

## GET /api/requests/lead-role/:id

Get full detail for a single lead role request.

**Auth:** Admin only

**Response 200**
```json
{
  "request": {
    "id": 7,
    "status": "pending_admin",
    "leadComment": "Approved by current lead.",
    "adminComment": null,
    "submittedAt": "2025-04-01T09:00:00.000Z",
    "leadReviewedAt": "2025-04-02T10:00:00.000Z",
    "reviewedAt": null,
    "club": {
      "id": 2,
      "name": "Chess Club"
    },
    "student": {
      "id": "uuid-of-student",
      "fullName": "Nurul Ain Binti Hamid",
      "staffOrMatricId": "A23CS0006",
      "email": "nurul@graduate.utm.my"
    },
    "currentLead": {
      "id": "uuid-of-current-lead",
      "fullName": "Ahmad Hafiz Bin Rashid"
    }
  }
}
```

`currentLead` is `null` when the club had no leader at the time of submission.

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not an admin |
| 404 | Request ID does not exist |

---

## PATCH /api/requests/lead-role/:id/lead-decision

Current lead approves or rejects a request directed at their club.

**Auth:** Lead only (must be the lead of the club the request targets)

**Request body**
```json
{
  "action": "approved",
  "comment": "Strong candidate, I support this."
}
```

| Field | Type | Required |
|-------|------|----------|
| `action` | `"approved"` \| `"rejected"` | Yes |
| `comment` | string | Required when `action` is `"rejected"`, optional otherwise |

**Response 200**
```json
{ "message": "Lead decision recorded" }
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `action` is `"rejected"` but `comment` is missing |
| 401 | No token or invalid token |
| 403 | Authenticated user is not a lead |
| 403 | Authenticated lead is not the lead assigned to this request |
| 404 | Request ID does not exist |
| 409 | Request is not in `pending_lead` status |

---

## PATCH /api/requests/lead-role/:id/admin-decision

Admin approves or rejects a request that has passed lead review (or was submitted to a leaderless club).

**Auth:** Admin only

**Request body**
```json
{
  "action": "approved",
  "adminComment": "Verified and approved."
}
```

| Field | Type | Required |
|-------|------|----------|
| `action` | `"approved"` \| `"rejected"` | Yes |
| `adminComment` | string | Required when `action` is `"rejected"`, optional otherwise |

**Response 200**
```json
{ "message": "Admin decision recorded" }
```

When `action` is `"approved"`:
- The student becomes the new lead of the club (`role` → `lead`)
- The previous lead (if any) becomes a regular member (`role` → `member`) and is added back to the club's member list
- The student is removed from the club's member list

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `action` is `"rejected"` but `adminComment` is missing |
| 401 | No token or invalid token |
| 403 | Authenticated user is not an admin |
| 404 | Request ID does not exist |
| 409 | Request is not in `pending_admin` status |
