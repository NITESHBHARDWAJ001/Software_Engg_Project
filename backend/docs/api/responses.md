# Response Models and Detailed Examples

This document defines canonical response structures returned by module endpoints.

## Authentication

### Login Response (`POST /api/v1/auth/login`)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
      "email": "admin@org.com",
      "firstName": "Org",
      "lastName": "Admin",
      "role": "ORG_ADMIN",
      "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0"
    }
  }
}
```

### Refresh Response (`POST /api/v1/auth/refresh`)

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

## Customer

Customer entities are returned directly from Prisma model.

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "f157f8de-9c44-4c89-b6f5-6f1909157f58",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "name": "Aarav Textiles",
    "email": "procurement@aaravtextiles.com",
    "phone": "+91-9000000000",
    "city": "Jaipur",
    "country": "India",
    "totalSpent": "0",
    "lifetimeValue": "0",
    "isArchived": false,
    "createdBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "updatedBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:00:00.000Z"
  }
}
```

### Customer Stats (`GET /api/v1/customers/stats`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "totalCustomers": 145,
    "activeCustomers": 138,
    "inactiveCustomers": 7,
    "totalRevenue": 338934.75,
    "averagePurchaseValue": 2337.4810344827584,
    "topCustomers": [
      {
        "id": "bd9c0a5d-0f8f-4216-b33e-88f79c29667e",
        "name": "Shreya Fabrics",
        "totalSpent": 61210,
        "lifetimeValue": 69200
      }
    ]
  }
}
```

## Inventory

Inventory item responses are Prisma entities with stock status and monetary fields.

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "ce06dc69-7cb0-4a5a-b0d4-b6755fe2e756",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "name": "Handloom Kurta",
    "sku": "KURTA-HL-001",
    "category": "Kurtas",
    "currentStock": 68,
    "reorderLevel": 20,
    "minStockLevel": 8,
    "unitPrice": "540",
    "sellingPrice": "899",
    "unit": "piece",
    "status": "IN_STOCK",
    "createdBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "updatedBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T11:00:00.000Z"
  }
}
```

### Inventory Stats (`GET /api/v1/inventory/stats`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "totalItems": 52,
    "totalValue": 947321,
    "lowStockItems": 5,
    "outOfStockItems": 1,
    "categoriesCount": 8,
    "recentTransactions": 21,
    "averageUnitPrice": 433.25
  }
}
```

## Finance

### Invoice Resource

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "d33707b8-9321-44e3-a35c-f0d67720f9a5",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "invoiceNumber": "INV-2026-001",
    "status": "PENDING",
    "issueDate": "2026-03-20T00:00:00.000Z",
    "dueDate": "2026-03-27T00:00:00.000Z",
    "paidAt": null,
    "currency": "USD",
    "subtotal": "1200",
    "taxAmount": "60",
    "discountAmount": "20",
    "totalAmount": "1240",
    "notes": "Showroom billing",
    "createdBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "updatedBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "createdAt": "2026-03-20T09:00:00.000Z",
    "updatedAt": "2026-03-20T09:00:00.000Z"
  }
}
```

### Cash Flow (`GET /api/v1/finance/analytics/cash-flow`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "from": "2025-04-01T00:00:00.000Z",
    "to": "2026-03-23T10:00:00.000Z",
    "income": 50000,
    "expense": 35000,
    "net": 15000
  }
}
```

### Finance Stats (`GET /api/v1/finance/analytics/stats`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "totalRevenue": 120000,
    "totalExpenses": 74000,
    "netProfit": 46000,
    "pendingInvoices": 3,
    "overdueInvoices": 1,
    "pendingAmount": 18200,
    "overdueAmount": 5200,
    "period": {
      "from": "2025-04-01T00:00:00.000Z",
      "to": "2026-03-23T10:00:00.000Z"
    }
  }
}
```

## Tasks

Task resource is mapped by service and returns derived user names.

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "f8f08784-9a59-408f-a73c-ea5944eaa6fd",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "title": "Prepare exhibition catalog",
    "description": "Finalize design and print",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assignedTo": "934136d5-f8ca-4f1f-aa95-d3109e3851dd",
    "assignedToName": "Priya Singh",
    "createdBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "createdByName": "Org Admin",
    "dueDate": "2026-03-30T00:00:00.000Z",
    "createdAt": "2026-03-21T10:20:00.000Z",
    "updatedAt": "2026-03-23T08:20:00.000Z",
    "completedAt": null,
    "tags": ["catalog", "print"],
    "relatedExhibitionId": "4f7af63f-4727-42f2-b52b-8dbd54ecf8d8",
    "relatedCustomerId": null,
    "attachments": [],
    "comments": []
  }
}
```

### Task Stats (`GET /api/v1/tasks/stats`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "total": 49,
    "todo": 13,
    "inProgress": 16,
    "review": 5,
    "completed": 12,
    "overdue": 3
  }
}
```

## Exhibitions

### Exhibition Resource

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "4f7af63f-4727-42f2-b52b-8dbd54ecf8d8",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "name": "Summer Ethnic Expo",
    "description": "Regional B2B showcase",
    "location": "Pragati Maidan",
    "startDate": "2026-04-05T00:00:00.000Z",
    "endDate": "2026-04-08T00:00:00.000Z",
    "status": "UPCOMING",
    "budget": 15000,
    "actualSpent": 5000,
    "expectedRevenue": 70000,
    "actualRevenue": 0,
    "expectedFootfall": 2000,
    "actualFootfall": null,
    "boothSize": "24x24",
    "stallNumber": "B12",
    "category": "Trade Show",
    "assignedStaff": ["934136d5-f8ca-4f1f-aa95-d3109e3851dd"],
    "assignedStaffNames": ["Priya Singh"],
    "totalLeads": 0,
    "convertedLeads": 0,
    "createdBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "createdAt": "2026-03-21T11:00:00.000Z",
    "updatedAt": "2026-03-21T11:00:00.000Z",
    "images": [],
    "notes": "Corner display"
  }
}
```

### Exhibition ROI (`GET /api/v1/exhibitions/:id/roi`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "exhibitionId": "4f7af63f-4727-42f2-b52b-8dbd54ecf8d8",
    "exhibitionName": "Summer Ethnic Expo",
    "budget": 15000,
    "totalInvestment": 15000,
    "revenue": 45500,
    "totalRevenue": 45500,
    "roi": 30500,
    "roisPercentage": 203.33333333333334,
    "roiPercentage": 203.33333333333334,
    "leads": 120,
    "totalLeads": 120,
    "conversions": 30,
    "convertedLeads": 30,
    "conversionRate": 25
  }
}
```

### Exhibition Lead Resource

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "7ed8fef0-f0a8-4cb7-9b58-8fe6f8beba2e",
    "exhibitionId": "4f7af63f-4727-42f2-b52b-8dbd54ecf8d8",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "name": "Nisha Traders",
    "phone": "+91-9811000000",
    "email": "nisha@traders.in",
    "company": "Nisha Traders",
    "interestLevel": "HOT",
    "status": "QUALIFIED",
    "interestedProducts": ["Sarees", "Lehengas"],
    "notes": "Follow-up for bulk quote",
    "capturedBy": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
    "capturedByName": "Org Admin",
    "capturedAt": "2026-03-22T12:00:00.000Z",
    "createdAt": "2026-03-22T12:00:00.000Z",
    "updatedAt": "2026-03-23T09:00:00.000Z",
    "followUpDate": "2026-03-25T00:00:00.000Z",
    "lastContactedDate": "2026-03-23T00:00:00.000Z",
    "source": "EXHIBITION",
    "estimatedValue": 24000,
    "interactions": [
      {
        "id": "01a8e7df-e84d-49bb-a9fd-bd6b90e3ea6d",
        "leadId": "7ed8fef0-f0a8-4cb7-9b58-8fe6f8beba2e",
        "userId": "6e903c8b-c2be-4dc0-9771-ab6f6f9771f6",
        "userName": "Org Admin",
        "type": "CALL",
        "notes": "Shared catalog and MOQ",
        "createdAt": "2026-03-23T09:15:00.000Z"
      }
    ]
  }
}
```

## Organizations

### Current Organization (`GET /api/v1/organizations/me`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "name": "Nitesh Ethnic",
    "slug": "nitesh-ethnic",
    "email": "hello@niteshethnic.com",
    "phone": "+91-9900000000",
    "createdAt": "2026-01-10T00:00:00.000Z",
    "updatedAt": "2026-03-20T00:00:00.000Z"
  }
}
```

## Subscriptions

### Plan Resource

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "75da58f3-ebc2-49ac-a182-93412144286e",
    "name": "Growth",
    "code": "GROWTH",
    "description": "For scaling teams",
    "billingCycle": "MONTHLY",
    "price": 1499,
    "currency": "USD",
    "isActive": true,
    "features": [
      "CUSTOMER_MANAGEMENT",
      "INVENTORY_MANAGEMENT",
      "FINANCE_MANAGEMENT",
      "TASK_MANAGEMENT",
      "EXHIBITION_MANAGEMENT"
    ],
    "limits": {
      "users": 25,
      "storageGb": 100
    },
    "createdBy": "129ab84f-999d-4f20-a761-60d48a69b642",
    "updatedBy": "129ab84f-999d-4f20-a761-60d48a69b642",
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:00:00.000Z"
  }
}
```

### Organization Subscription Resource

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "id": "4f1adb6c-0cc6-4e7a-ba02-cf025fe56fd3",
    "organizationId": "5fa37038-5f2f-429d-bec7-2d36f6357aa0",
    "planId": "75da58f3-ebc2-49ac-a182-93412144286e",
    "status": "ACTIVE",
    "startDate": "2026-03-23T00:00:00.000Z",
    "endDate": null,
    "trialEndsAt": null,
    "canceledAt": null,
    "autoRenew": true,
    "seats": 15,
    "includedFeatures": [],
    "excludedFeatures": ["FINANCE_MANAGEMENT"],
    "metadata": {
      "assignedBy": "migration-script"
    },
    "createdBy": "129ab84f-999d-4f20-a761-60d48a69b642",
    "updatedBy": "129ab84f-999d-4f20-a761-60d48a69b642",
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:00:00.000Z",
    "plan": {
      "id": "75da58f3-ebc2-49ac-a182-93412144286e",
      "name": "Growth",
      "code": "GROWTH",
      "description": "For scaling teams",
      "billingCycle": "MONTHLY",
      "price": 1499,
      "currency": "USD",
      "isActive": true,
      "features": [
        "CUSTOMER_MANAGEMENT",
        "INVENTORY_MANAGEMENT",
        "FINANCE_MANAGEMENT",
        "TASK_MANAGEMENT",
        "EXHIBITION_MANAGEMENT"
      ],
      "limits": {
        "users": 25,
        "storageGb": 100
      },
      "createdBy": "129ab84f-999d-4f20-a761-60d48a69b642",
      "updatedBy": "129ab84f-999d-4f20-a761-60d48a69b642",
      "createdAt": "2026-03-23T10:00:00.000Z",
      "updatedAt": "2026-03-23T10:00:00.000Z"
    },
    "effectiveFeatures": [
      "CUSTOMER_MANAGEMENT",
      "INVENTORY_MANAGEMENT",
      "TASK_MANAGEMENT",
      "EXHIBITION_MANAGEMENT"
    ]
  }
}
```

### Feature Access Check (`GET /api/v1/subscriptions/me/features/:featureKey`)

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "featureKey": "FINANCE_MANAGEMENT",
    "hasAccess": false
  }
}
```

## Pagination Contract

Any paginated endpoint returns:

```json
{
  "success": true,
  "data": [
    {}
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 153,
    "totalPages": 8
  }
}
```

## Date and Numeric Notes

- Date/time values are ISO-8601 strings in JSON responses.
- Decimal database values may appear as strings on Prisma direct entities.
- Service-mapped analytics responses return numeric values as JSON numbers.
