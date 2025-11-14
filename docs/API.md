# API Documentation

## Overview
This document describes the REST API endpoints available in the Axtronet Instagram CM Agent.

## Base URL
```
http://localhost:3000
```

## Endpoints

### Health Check

#### GET /health
Check if the service is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Webhook Endpoints

#### GET /webhook
Webhook verification endpoint for Instagram.

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Your configured verification token
- `hub.challenge`: Challenge string from Instagram

**Response:** Returns the challenge string if verification succeeds.

#### POST /webhook
Receives Instagram webhook events.

**Request Body:**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "instagram_account_id",
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "comment_id",
            "from": {
              "id": "user_id",
              "username": "username"
            },
            "text": "Comment text",
            "media": {
              "id": "media_id"
            }
          }
        }
      ]
    }
  ]
}
```

**Response:** 200 OK

### Candidate Management

#### GET /api/candidates
Get all candidates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate_id",
      "userId": "instagram_user_id",
      "username": "username",
      "engagementScore": 15,
      "interactions": [...],
      "status": "new",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### GET /api/candidates/:id
Get a specific candidate by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "candidate_id",
    "userId": "instagram_user_id",
    "username": "username",
    "engagementScore": 15,
    "interactions": [
      {
        "type": "comment",
        "text": "Me interesa",
        "sentiment": {...},
        "intent": {...},
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "status": "new"
  }
}
```

#### POST /api/candidates/:id/invite
Manually invite a candidate to the selection process.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "candidate_id",
    "status": "invited",
    "invitedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Job Posting

#### POST /api/jobs/post
Post a job offer to Instagram.

**Request Body:**
```json
{
  "message": "Job description and details",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media_id"
  }
}
```

### Statistics

#### GET /api/stats/engagement
Get engagement statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCandidates": 50,
    "newCandidates": 30,
    "invitedCandidates": 20,
    "averageEngagementScore": 12.5,
    "totalInteractions": 150,
    "topCandidates": [
      {
        "username": "user1",
        "engagementScore": 25,
        "status": "invited",
        "interactionCount": 10
      }
    ]
  }
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Status Codes

- `200 OK`: Successful request
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
