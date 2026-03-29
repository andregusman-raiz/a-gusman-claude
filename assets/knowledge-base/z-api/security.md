# Z-API Security Reference

> Base URL: `https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}`

## Overview

Z-API implements multiple security layers to protect API access. All API calls should NEVER be made from frontend applications -- always call from server-side to avoid exposing credentials.

---

## 1. ID and Token Authentication

Z-API uses a two-factor authentication approach with Instance ID and Token.

### How to Obtain

1. Create an account on Z-API
2. Generate an instance (each instance receives unique credentials)
3. Access the instance in the admin panel
4. Click "edit" to view ID and Token

### URL Pattern

Credentials are embedded in the endpoint URL:

```
https://api.z-api.io/instances/{YOUR_INSTANCE}/token/{YOUR_TOKEN}/{endpoint}
```

### Security Warning

- **NEVER** share your ID and Token with anyone
- **NEVER** make API calls from the frontend
- Anyone with these credentials can send messages on your behalf

---

## 2. Account Security Token (Client-Token)

An additional authentication layer that validates API requests.

### How to Get It

1. Sign into your Z-API account
2. Navigate to "Security" tab > "Account Security Token"
3. Select "Configure now" to generate your token
4. Token is initially disabled to avoid disrupting existing operations

### How to Use

Include in all HTTP requests as a header:

```
Client-Token: YOUR_SECURITY_TOKEN
```

### Activation

1. Update your application to send the `Client-Token` header
2. Click "Activate Token" in the admin panel
3. From that point, all requests MUST include the correct token

### Error Response (Missing/Invalid Token)

```json
{
  "error": "null not allowed"
}
```

---

## 3. IP Request Restriction

Controls API access by limiting calls to authorized IP addresses.

### Configuration

1. Log into Z-API control panel
2. Navigate to "Security" section
3. Configure IP whitelist

### Behavior

| State | Effect |
|-------|--------|
| Inactive | API accepts requests from any IP |
| Active | Only whitelisted IPs can access the API |

### Error Response (Blocked IP)

```json
{
  "error": "[IP request] not allowed"
}
```

### Benefits
- Restrict API usage to trusted IPs
- Defend against unauthorized access
- Meet regulatory compliance requirements

---

## 4. Two-Factor Authentication (2FA)

Dashboard-level security (not API-level).

### Setup

1. Log into Z-API dashboard
2. Navigate to "Security" section
3. Select "Two-Factor Authentication" > "Configure Now"
4. Scan QR code with authenticator app

### Compatible Apps

- 1Password
- Google Authenticator
- Microsoft Authenticator

### Behavior

After configuration, each dashboard login requires a one-time code from the authenticator app in addition to the password.

---

## Security Best Practices Summary

1. **Never expose credentials in frontend code**
2. **Enable Client-Token** for all instances
3. **Configure IP restrictions** for production environments
4. **Enable 2FA** for dashboard access
5. **Rotate tokens** periodically
6. **Use HTTPS** for all webhook endpoints (Z-API rejects HTTP)
