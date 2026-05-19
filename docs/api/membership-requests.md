# Membership Requests API

Base URL: `http://localhost:5000/api`

All requests that require authentication must include:
```
Authorization: Bearer <token>
```

---

## Overview

This module handles students requesting to join a club as a member. Requests can be submitted at signup or post-signup. The club's lead reviews and decides on each request.

**Status flow**

```
pending  →  (lead approves)  →  approved
pending  →  (lead rejects)   →  rejected
```

Once a request reaches `approved` or `rejected`, no further action can be taken on it.

**On approval:**
- `users.role` → `member`
- A `club_members` row is inserted for the student

**Multi-club:** A student can be a member of more than one club. Approving one request does not cancel others.

---

## POST /api/auth/signup *(modified)*

Create a new account. When `role` is `"member"`, a pending membership request is also created and the account is stored with `role = "student"` until the lead approves.

**Auth:** Public

**Request body**

```json
{
  "name": "Nurul Ain Binti Hamid",
  "email": "nurul@graduate.utm.my",
  "password": "Password123!",
  "matricNumber": "A23CS0002",
  "role": "student",
  "clubId": 1
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `email` | string | Yes — must be a valid UTM email |
| `password` | string | Yes — minimum 8 characters |
| `matricNumber` | string | Yes — format: one letter, two digits, two letters, four digits (e.g. `A23CS0002`) |
| `role` | `"student"` \| `"member"` | Yes |
| `clubId` | number | Required when `role` is `"member"` |

**Response 201 — role is `"student"`**
```json
{
  "user": {
    "id": "uuid",
    "fullName": "Mohd Faiz Bin Ramli",
    "email": "faiz@graduate.utm.my",
    "staffOrMatricId": "A23CS0001",
    "role": "student",
    "createdAt": "2026-05-19T10:00:00.000Z"
  }
}
```

**Response 201 — role is `"member"`**
```json
{
  "user": {
    "id": "uuid",
    "fullName": "Nurul Ain Binti Hamid",
    "email": "nurul@graduate.utm.my",
    "staffOrMatricId": "A23CS0002",
    "role": "student",
    "createdAt": "2026-05-19T10:00:00.000Z"
  },
  "message": "Membership request submitted, pending approval",
  "requestId": 5
}
```

> Note: `role` in the response is always `"student"` — the student can log in immediately and check their request status while waiting for lead approval.

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `clubId` is missing when `role` is `"member"` |
| 400 | `matricNumber` format is invalid |
| 403 | `role` is `"lead"` or `"admin"` |
| 404 | Club does not exist (only when `role` is `"member"`) |
| 409 | Email is already registered |
| 409 | Matric number is already registered |

---

## POST /api/requests/membership

Submit a membership request for an existing club. For students who are already logged in and want to join a club after signup.

**Auth:** Student or Member

**Request body**
```json
{
  "clubId": 1
}
```

**Response 201**
```json
{
  "requestId": 5
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not a student or member |
| 404 | Club does not exist |
| 409 | User already has a pending request for this club |
| 409 | User is already a member of this club |

---

## GET /api/requests/membership/mine

Get all membership requests submitted by the authenticated user.

**Auth:** Student or Member

**Response 200**
```json
{
  "requests": [
    {
      "id": 5,
      "clubId": 1,
      "clubName": "Tech Club",
      "status": "pending",
      "leadComment": null,
      "submittedAt": "2026-05-19T10:00:00.000Z",
      "reviewedAt": null
    }
  ]
}
```

Returns an empty array if the user has no requests:
```json
{ "requests": [] }
```

`leadComment` is `null` until the lead rejects the request. `reviewedAt` is `null` while the request is still pending.

**Error responses**

| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 403 | Authenticated user is not a student or member |

---

## GET /api/requests/membership/incoming

Get membership requests directed at the authenticated lead's club.

**Auth:** Lead only

**Query params**

| Param | Values | Default |
|-------|--------|---------|
| `status` | `pending` \| `all` | `pending` |

**Response 200**
```json
{
  "requests": [
    {
      "id": 5,
      "status": "pending",
      "submittedAt": "2026-05-19T10:00:00.000Z",
      "student": {
        "id": "uuid-of-student",
        "fullName": "Nurul Ain Binti Hamid",
        "staffOrMatricId": "A23CS0002"
      }
    }
  ]
}
```

The club is derived from the authenticated lead's account — no `clubId` parameter is needed.

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `status` query param is not `pending` or `all` |
| 401 | No token or invalid token |
| 403 | Authenticated user is not a lead |
| 404 | No club is assigned to this lead |

---

## PATCH /api/requests/membership/:id/decision

Approve or reject a membership request directed at the authenticated lead's club.

**Auth:** Lead only (must be the lead of the club the request targets)

**Request body**
```json
{
  "action": "rejected",
  "leadComment": "Club is currently at full capacity."
}
```

| Field | Type | Required |
|-------|------|----------|
| `action` | `"approved"` \| `"rejected"` | Yes |
| `leadComment` | string | Required when `action` is `"rejected"`, not needed otherwise |

**Response 200**
```json
{ "message": "Membership request approved" }
```
```json
{ "message": "Membership request rejected" }
```

When `action` is `"approved"`:
- `users.role` → `"member"` for the student
- A `club_members` row is inserted (student joins the club)
- The student may still have other pending requests for other clubs — those are unaffected

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `action` is not `"approved"` or `"rejected"` |
| 400 | `action` is `"rejected"` but `leadComment` is missing |
| 401 | No token or invalid token |
| 403 | Authenticated user is not a lead |
| 403 | Authenticated lead is not the lead of this request's club |
| 404 | Request ID does not exist |
| 409 | Request is not in `pending` status |
