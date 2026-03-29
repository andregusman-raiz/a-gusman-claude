# Finnet API — Technical Reference Guide

**Document Purpose**: Developer-focused technical specifications for Finnet API integration
**Last Updated**: 2026-03-25
**Target Audience**: Backend engineers, integration specialists, API developers

---

## 1. API Overview

### Endpoints

**Primary Documentation Portal:**
- https://docs.iofinnet.com/reference/core-introduction
- https://docs.dev.iodevnet.com/
- https://openbanking-docs.finnet.com.br/homol/docs (Open Banking)

### API Architecture

**Type**: RESTful JSON APIs
**Auth**: OAuth 2.0 (access token pattern)
**Protocol**: HTTPS (mandatory)
**Response Format**: JSON

---

## 2. Authentication

### OAuth 2.0 Access Token Flow

**Endpoint**: `https://api.iofinnet.com/v1/auth/accessToken`

**Request**:
```
POST /v1/auth/accessToken
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Using Access Token

**Pattern**: Include in all subsequent requests

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example**:
```
GET /v1/accounts HTTP/1.1
Host: api.iofinnet.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Credential Management

- **Client ID**: Provided by Finnet during onboarding
- **Client Secret**: Keep secure (never commit to version control)
- **Token Expiration**: Tokens expire after specified period (typically 1 hour)
- **Refresh**: Obtain new token by calling `/auth/accessToken` again
- **Rotation**: Finnet supports credential rotation for security

---

## 3. Core API Modules

### 3.1 Accounts & Balances

**Retrieve Account List**
```
GET /v1/accounts
Authorization: Bearer {TOKEN}
```

**Query Balances**
```
GET /v1/accounts/{account_id}/balance
Authorization: Bearer {TOKEN}
```

**Supported Fields**:
- Account ID (conta)
- Bank Code (banco)
- Agency (agência)
- Account Number (número da conta)
- Account Type (tipo de conta: corrente, poupança)
- CNPJ/CPF (document identifier)

---

### 3.2 Statements & Transactions

**Retrieve Statement**
```
GET /v1/accounts/{account_id}/statements
?start_date=2026-03-01&end_date=2026-03-31
Authorization: Bearer {TOKEN}
```

**Query Parameters**:
- `start_date`: ISO 8601 format (YYYY-MM-DD)
- `end_date`: ISO 8601 format (YYYY-MM-DD)
- `limit`: Max records per request
- `offset`: Pagination offset

**Response Includes**:
- Transaction date (data)
- Description (descrição)
- Amount (valor)
- Type (débito/crédito)
- Running balance (saldo)
- Transaction reference/identifier

**Frequency**: Real-time queries available

---

### 3.3 Payments & Transfers

**Initiate Payment**
```
POST /v1/payments
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "from_account_id": "account_123",
  "to_document": "12345678000123",
  "to_account": "0000123-4",
  "to_bank_code": "001",
  "amount": 1000.00,
  "currency": "BRL",
  "type": "TED", // TED, DOC, PIX
  "description": "Payment reference",
  "scheduled_date": "2026-03-26"
}
```

**Supported Payment Types**:
- **TED**: Real-time transfer (Transferência Eletrônica de Dados)
- **DOC**: Next-day transfer (Débito em Outros Bancos)
- **PIX**: Instant payment (24/7 settlement)
- **Boleto**: Registered or unregistered
- **Card**: Credit/debit via gateway

**Response**:
```json
{
  "payment_id": "pay_abc123",
  "status": "processed",
  "timestamp": "2026-03-25T14:30:00Z",
  "amount": 1000.00,
  "fee": 10.00,
  "reference": "REF-001"
}
```

**Status Codes**:
- `pending`: Awaiting processing
- `processing`: In transit
- `processed`: Successfully completed
- `failed`: Transaction failed
- `canceled`: Cancelled by user or system

---

### 3.4 Boleto/Collections Management

**Create Boleto**
```
POST /v1/boletos
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "document_type": "registered", // or "unregistered"
  "amount": 500.00,
  "due_date": "2026-04-25",
  "payer": {
    "document": "12345678000123",
    "name": "Company Name",
    "email": "contact@company.com",
    "address": "Rua X, 100"
  },
  "payee_bank_code": "001",
  "portfolio": "12",
  "description": "Invoice #123"
}
```

**Registered vs. Unregistered Boletos**:
- **Registered**: Bank maintains records, full tracking
- **Unregistered**: Faster issuance, limited tracking

**Response Includes**:
- Boleto barcode (código de barras)
- Boleto number (nosso número)
- PDF link for printing
- QR Code data
- Expiration date
- Amount and fees

---

### 3.5 PIX Integration

**Create PIX Key**
```
POST /v1/pix/keys
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "account_id": "account_123",
  "key_type": "cpf", // cpf, cnpj, email, phone, random_key
  "key_value": "12345678000123",
  "key_description": "Main business account"
}
```

**Send PIX Payment**
```
POST /v1/pix/transfers
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "from_account_id": "account_123",
  "to_key": "empresa@company.com", // PIX key (CNPJ, CPF, email, phone)
  "amount": 250.00,
  "description": "Payment for services"
}
```

**PIX Response** (typically instant):
```json
{
  "pix_id": "pix_xyz789",
  "status": "completed",
  "settlement_time": "2026-03-25T14:32:15Z",
  "amount": 250.00,
  "identifier": "e123456789abcdef123456789abcdef"
}
```

---

### 3.6 CNAB File Processing

**Upload CNAB File**
```
POST /v1/cnab/upload
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data

file: (binary CNAB file)
format: "240" // or "400"
service_type: "collection" // or "payment"
```

**CNAB File Specifications**:
- **Format**: CNAB 240 (4 segments × 240 positions) or CNAB 400 (single segment)
- **Encoding**: ASCII/EBCDIC (depends on bank)
- **Line Ending**: CRLF (Windows) or LF (Unix)

**Conversion to API**:
```
POST /v1/cnab/convert-to-api
Authorization: Bearer {TOKEN}

{
  "cnab_content": "raw CNAB file content",
  "format": "240",
  "target_service": "payments" // or "collections"
}
```

**Returns**: Parsed JSON representation of CNAB file with all transaction details

---

### 3.7 CNAB Return Processing

**Retrieve CNAB Return Files**
```
GET /v1/cnab/returns
?date_range=last_7_days
Authorization: Bearer {TOKEN}
```

**Response Includes**:
- File received date
- Number of processed items
- Success/failure counts
- Individual transaction statuses
- Error details for failed items

**Automatic Reconciliation**:
- Finnet processes return files automatically
- Updates transaction statuses in real-time
- Triggers webhooks for completion events

---

### 3.8 Multi-bank Data Consolidation

**List All Connected Banks**
```
GET /v1/banks/connected
Authorization: Bearer {TOKEN}
```

**Response**:
```json
{
  "banks": [
    {
      "bank_code": "001",
      "bank_name": "Banco do Brasil",
      "accounts": 3,
      "last_sync": "2026-03-25T14:00:00Z"
    },
    {
      "bank_code": "033",
      "bank_name": "Banco Santander",
      "accounts": 2,
      "last_sync": "2026-03-25T14:15:00Z"
    }
  ]
}
```

**Consolidated Balance Query** (across all banks):
```
GET /v1/consolidated/balance
Authorization: Bearer {TOKEN}
```

---

## 4. Data Models & Schemas

### Account Object

```json
{
  "id": "account_123",
  "bank_code": "001",
  "bank_name": "Banco do Brasil",
  "agency": "1234",
  "account_number": "0000567-8",
  "account_type": "corrente",
  "holder_document": "12345678000123",
  "holder_name": "Company Name",
  "balance": 50000.00,
  "available_balance": 49500.00,
  "currency": "BRL",
  "status": "active",
  "created_at": "2020-06-15T10:30:00Z",
  "last_sync": "2026-03-25T14:30:00Z"
}
```

### Transaction Object

```json
{
  "id": "txn_456",
  "account_id": "account_123",
  "type": "credit", // debit or credit
  "amount": 1000.00,
  "currency": "BRL",
  "description": "Transfer from another account",
  "reference": "REF-789",
  "transaction_date": "2026-03-25",
  "posting_date": "2026-03-25",
  "balance_after": 51000.00,
  "counterparty_document": "98765432000111",
  "counterparty_bank": "033",
  "status": "completed"
}
```

### Payment Object

```json
{
  "id": "pay_789",
  "account_id": "account_123",
  "type": "TED",
  "amount": 2000.00,
  "fee": 20.00,
  "total_amount": 2020.00,
  "status": "completed",
  "reference": "PAG-001",
  "to_document": "98765432000111",
  "to_account": "0000999-0",
  "to_bank": "033",
  "description": "Supplier payment",
  "created_at": "2026-03-25T10:00:00Z",
  "processed_at": "2026-03-25T11:30:00Z",
  "return_code": "00",
  "return_message": "Autorizado"
}
```

### Boleto Object

```json
{
  "id": "boleto_321",
  "status": "issued",
  "barcode": "12345.67890 12345.678901 12345.678901 1 12345678901234",
  "boleto_number": "000000123",
  "amount": 500.00,
  "due_date": "2026-04-25",
  "issued_date": "2026-03-25",
  "payer_document": "12345678000123",
  "payer_name": "Customer Company",
  "payee_bank": "001",
  "portfolio": "12",
  "variation": "001",
  "qr_code": "00020126580014br.gov.bcb.brcode...",
  "qr_code_url": "https://api.finnet.com.br/qrcode/xyz",
  "pdf_url": "https://api.finnet.com.br/pdf/boleto_321.pdf",
  "payment_status": "pending",
  "payment_date": null
}
```

---

## 5. Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "INVALID_ACCOUNT",
    "message": "Account not found or invalid",
    "details": {
      "account_id": "account_invalid",
      "timestamp": "2026-03-25T14:30:00Z"
    }
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INVALID_REQUEST` | 400 | Malformed request |
| `INVALID_ACCOUNT` | 400 | Account doesn't exist |
| `INSUFFICIENT_FUNDS` | 402 | Account balance too low |
| `BANK_UNAVAILABLE` | 503 | Bank temporarily unavailable |
| `CNAB_INVALID_FORMAT` | 400 | CNAB file format error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |

---

## 6. Webhooks & Event Streaming

### Webhook Events

**Payment Completed**
```json
{
  "event_type": "payment.completed",
  "payment_id": "pay_789",
  "status": "completed",
  "timestamp": "2026-03-25T11:30:00Z"
}
```

**Boleto Paid**
```json
{
  "event_type": "boleto.paid",
  "boleto_id": "boleto_321",
  "amount": 500.00,
  "payment_date": "2026-03-25",
  "timestamp": "2026-03-25T16:45:00Z"
}
```

**CNAB Return Processed**
```json
{
  "event_type": "cnab.return_processed",
  "file_id": "cnab_abc123",
  "processed_items": 150,
  "success_count": 148,
  "failure_count": 2,
  "timestamp": "2026-03-25T18:00:00Z"
}
```

**Webhook Endpoint Configuration**:
```
POST /v1/webhooks
Authorization: Bearer {TOKEN}

{
  "url": "https://your-app.com/webhooks/finnet",
  "events": ["payment.completed", "boleto.paid", "statement.updated"],
  "retry_policy": "exponential_backoff"
}
```

---

## 7. Rate Limits & Quotas

### API Rate Limiting

- **Standard**: 1,000 requests per hour
- **Burst**: 100 requests per 10 seconds
- **CNAB File Upload**: 50 files per day

### Response Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1648212600
```

### Best Practices

1. **Implement exponential backoff** for retries
2. **Cache frequently accessed data** (accounts, banks)
3. **Use pagination** for large result sets
4. **Batch CNAB files** when possible
5. **Monitor remaining quota** via response headers

---

## 8. Integration Examples

### Python Integration

```python
import requests
from datetime import datetime, timedelta

class FinnetAPIClient:
    BASE_URL = "https://api.iofinnet.com"

    def __init__(self, client_id, client_secret):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None

    def authenticate(self):
        response = requests.post(
            f"{self.BASE_URL}/v1/auth/accessToken",
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
        )
        self.access_token = response.json()["access_token"]

    def get_accounts(self):
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.BASE_URL}/v1/accounts",
            headers=headers
        )
        return response.json()

    def get_balance(self, account_id):
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.BASE_URL}/v1/accounts/{account_id}/balance",
            headers=headers
        )
        return response.json()

    def send_pix(self, from_account, to_key, amount, description):
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "from_account_id": from_account,
            "to_key": to_key,
            "amount": amount,
            "description": description
        }
        response = requests.post(
            f"{self.BASE_URL}/v1/pix/transfers",
            json=payload,
            headers=headers
        )
        return response.json()

# Usage
client = FinnetAPIClient("your_client_id", "your_client_secret")
client.authenticate()
accounts = client.get_accounts()
```

### JavaScript/Node.js Integration

```javascript
const axios = require('axios');

class FinnetClient {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = 'https://api.iofinnet.com';
    this.accessToken = null;
  }

  async authenticate() {
    const response = await axios.post(
      `${this.baseUrl}/v1/auth/accessToken`,
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    );
    this.accessToken = response.data.access_token;
  }

  async getAccounts() {
    const response = await axios.get(
      `${this.baseUrl}/v1/accounts`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    );
    return response.data;
  }

  async getStatements(accountId, startDate, endDate) {
    const response = await axios.get(
      `${this.baseUrl}/v1/accounts/${accountId}/statements`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: { start_date: startDate, end_date: endDate }
      }
    );
    return response.data;
  }

  async createBoleto(boleto) {
    const response = await axios.post(
      `${this.baseUrl}/v1/boletos`,
      boleto,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    );
    return response.data;
  }
}

// Usage
const client = new FinnetClient('your_client_id', 'your_client_secret');
await client.authenticate();
const accounts = await client.getAccounts();
```

---

## 9. Security Best Practices

### API Key Management

1. **Never commit credentials** to version control
2. **Use environment variables** for client_id and client_secret
3. **Rotate credentials** periodically (recommended: quarterly)
4. **Use separate credentials** for development/staging/production
5. **Monitor API logs** for unauthorized access attempts

### Data Protection

1. **Always use HTTPS** (TLS 1.2+)
2. **Implement request signing** for sensitive operations
3. **Encrypt sensitive data** at rest (PII, account numbers)
4. **Validate input** before sending to API
5. **Use certificate pinning** in mobile applications

### Compliance

- **PCI DSS**: Finnet is certified, ensure your integration is compliant
- **GDPR/LGPD**: Handle personal data according to regulations
- **Audit Trail**: Log all API calls and transactions
- **Access Control**: Implement role-based permission model
- **Data Residency**: Financial data must remain in Brazil

---

## 10. Support & Resources

### Documentation
- **API Docs**: https://docs.iofinnet.com/
- **Open Banking**: https://openbanking-docs.finnet.com.br/homol/docs
- **GitHub**: https://github.com/IoFinnet

### Support Channels
- **Email**: marketing@finnet.com.br
- **Phone**: (11) 3882-9200
- **Help Center**: Available for partners
- **Status Page**: Monitor API availability

### SLA & Availability
- **Uptime Target**: 99.9% (9.9 hours downtime/month)
- **Response Time**: <200ms (p95)
- **Support Hours**: 9 AM – 6 PM (BRT, business days)

---

## 11. Migration & Integration Timeline

### Phase 1: Planning (Weeks 1-2)
- Review API documentation
- Obtain client credentials
- Design integration architecture
- Plan data mapping (legacy ↔ API)

### Phase 2: Development (Weeks 3-6)
- Implement authentication
- Build API client wrapper
- Integrate account/balance queries
- Test payment workflows

### Phase 3: Testing (Weeks 7-8)
- Unit testing
- Integration testing with sandbox
- End-to-end testing
- Load testing (if applicable)

### Phase 4: Deployment (Week 9)
- Production credential setup
- Final security review
- Go-live coordination
- Monitoring & alerting setup

---

## 12. Troubleshooting

### Common Issues

**Issue**: `UNAUTHORIZED` error on all requests
- **Solution**: Re-authenticate, token may have expired
- **Check**: Ensure token included in Authorization header

**Issue**: `BANK_UNAVAILABLE` when initiating payment
- **Solution**: Bank may be under maintenance; retry after 30 minutes
- **Check**: Monitor bank status pages

**Issue**: CNAB file rejected with format error
- **Solution**: Verify file encoding (ASCII vs. EBCDIC)
- **Check**: Ensure line endings are CRLF, not just LF

**Issue**: PIX transfer fails with invalid key
- **Solution**: Verify recipient PIX key exists and is active
- **Check**: Format should be valid email, phone, CNPJ, or CPF

---

**Document Version**: 1.0
**Last Updated**: 2026-03-25
**API Version**: v1 (current)
**Maintenance**: Updated quarterly with API changes
