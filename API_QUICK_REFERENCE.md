# 🚀 Devovia API - Quick Reference

## 📍 Access Documentation

**Interactive Docs:** http://localhost:4000/api/docs

**OpenAPI Spec:** http://localhost:4000/api/docs/spec

---

## 🔑 Quick Authentication Flow

### 1. Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 3. Use Token
```bash
curl -X GET http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📚 Common Endpoints

### Projects
```bash
# List projects (with filters)
GET /api/projects?page=1&limit=12&search=react&sortBy=createdAt&sortOrder=desc

# Create project
POST /api/projects

# Get project
GET /api/projects/{id}

# Update project
PUT /api/projects/{id}

# Delete project
DELETE /api/projects/{id}
```

### Snippets
```bash
# List snippets
GET /api/snippets?language=typescript&tag=react

# Create snippet
POST /api/snippets

# Get snippet
GET /api/snippets/{id}
```

### Sessions
```bash
# List sessions
GET /api/sessions

# Create session
POST /api/sessions

# Join session
POST /api/sessions/{id}/join
```

### Blogs
```bash
# List blogs
GET /api/blogs?page=1&tag=tutorial

# Create blog
POST /api/blogs

# Get blog
GET /api/blogs/{slug}
```

---

## 🎯 Query Parameters (List Endpoints)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number | `?page=2` |
| `limit` | number | Items per page (max 100) | `?limit=20` |
| `search` | string | Full-text search | `?search=react` |
| `sortBy` | string | Sort field | `?sortBy=createdAt` |
| `sortOrder` | string | asc or desc | `?sortOrder=desc` |

---

## 📦 Response Format

### Success (Single)
```json
{
  "success": true,
  "data": { /* resource */ },
  "message": "Success message",
  "meta": { "timestamp": "2026-01-26T..." }
}
```

### Success (List)
```json
{
  "success": true,
  "data": [ /* resources */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Success message",
  "meta": { "timestamp": "2026-01-26T..." }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "meta": { "timestamp": "2026-01-26T..." }
}
```

---

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token expires in: **24 hours**

---

## 🎨 Documentation Tools Comparison

| Tool | Status | URL |
|------|--------|-----|
| **Scalar** ⭐ | ✅ Active | http://localhost:4000/api/docs |
| Swagger UI | Available | Can be added |
| Postman | External | Import OpenAPI spec |
| Redoc | Available | Can be added |

---

## 🛠️ Development Tools

### Test with cURL
```bash
# Save token
TOKEN="your_token_here"

# Use in requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/projects
```

### Test with JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:4000/api/projects', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Test with Postman
1. Import OpenAPI spec: http://localhost:4000/api/docs/spec
2. Set Authorization → Bearer Token
3. Test endpoints

---

## 📊 API Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate) |
| 500 | Internal Server Error |

---

## 🎯 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `NOT_FOUND` | Resource doesn't exist |
| `UNAUTHORIZED` | Missing/invalid token |
| `FORBIDDEN` | No permission |
| `INTERNAL_SERVER_ERROR` | Server error |
| `ALREADY_EXISTS` | Duplicate resource |

---

## 💡 Pro Tips

1. **Use the interactive docs** - Fastest way to test
2. **Save your tokens** - Use the Authorize button
3. **Check examples** - Every endpoint has examples
4. **Use filters** - Reduce data transfer
5. **Paginate wisely** - Don't fetch everything at once

---

## 🔗 Quick Links

- **API Docs**: http://localhost:4000/api/docs
- **OpenAPI Spec**: http://localhost:4000/api/docs/spec
- **Health Check**: http://localhost:4000/api/hc
- **Root**: http://localhost:4000/

---

## 📞 Support

For issues or questions:
- Check the full guide: `API_DOCUMENTATION_GUIDE.md`
- Review OpenAPI spec for details
- Test in the interactive docs first

---

**Last Updated:** January 26, 2026
**API Version:** 1.0.0
