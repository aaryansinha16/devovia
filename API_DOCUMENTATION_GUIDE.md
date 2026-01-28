# 📚 Devovia API Documentation Guide

## 🎯 Overview

Your API now has **modern, interactive documentation** powered by **Scalar** - a beautiful, fast alternative to Swagger UI.

---

## 🚀 Quick Start

### Access the Documentation

**Development:**
```
http://localhost:4000/api/docs
```

**Production:**
```
https://api.devovia.com/api/docs
```

### Get OpenAPI Spec (JSON)

```
http://localhost:4000/api/docs/spec
```

---

## ✨ Features

### 1. **Beautiful Modern UI**
- Clean, developer-friendly interface
- Dark mode support
- Responsive design
- Fast performance

### 2. **Interactive API Testing**
- Built-in API client
- Test endpoints directly from the browser
- No need for Postman/Insomnia
- Save authentication tokens

### 3. **Comprehensive Documentation**
- All endpoints documented
- Request/response examples
- Schema definitions
- Authentication flows

### 4. **Standards-Based**
- OpenAPI 3.1 specification
- Industry-standard format
- Compatible with other tools

---

## 🔐 How to Test APIs

### Step 1: Get Authentication Token

1. Go to `http://localhost:4000/api/docs`
2. Find **Authentication** section
3. Click on **POST /api/auth/login** or **POST /api/auth/register**
4. Click **"Try it"**
5. Fill in the request body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
6. Click **"Send"**
7. Copy the `accessToken` from the response

### Step 2: Authorize

1. Click the **"Authorize"** button at the top
2. Paste your token in the format: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"**

### Step 3: Test Protected Endpoints

Now you can test any protected endpoint:

1. Navigate to any endpoint (e.g., **GET /api/projects**)
2. Click **"Try it"**
3. Modify query parameters if needed
4. Click **"Send"**
5. View the response

---

## 📖 API Sections

### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### 📁 Projects
- `GET /api/projects` - List all projects (with filters, search, sort, pagination)
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### 💬 Sessions
- Real-time collaboration sessions
- Session management
- Participant tracking

### 📝 Snippets
- `GET /api/snippets` - List snippets (with filters)
- `POST /api/snippets` - Create snippet
- `GET /api/snippets/{id}` - Get snippet
- `PUT /api/snippets/{id}` - Update snippet
- `DELETE /api/snippets/{id}` - Delete snippet

### 📚 Runbooks
- Automation runbooks
- Execution tracking
- Approval workflows

### ✍️ Blogs
- Blog post management
- Publishing workflow
- Tag-based filtering

### 👥 Users
- User profiles
- User management

### 💭 Comments & Likes
- Comment system
- Like/unlike functionality

### 🔧 Admin & Moderator
- Administrative endpoints
- Moderation tools

---

## 🎨 Customization

The documentation UI can be customized in `apps/api/src/routes/docs.routes.ts`:

```typescript
apiReference({
  theme: 'purple',        // Change theme: purple, blue, green, etc.
  layout: 'modern',       // Layout style
  // ... more options
})
```

---

## 📝 Adding New Endpoints

To document a new endpoint, create a JSDoc comment in `apps/api/src/docs/`:

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - YourTag
 *     summary: Brief description
 *     description: Detailed description
 *     parameters:
 *       - in: query
 *         name: param1
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
```

---

## 🔄 Comparison with Other Tools

| Feature | Scalar | Swagger UI | Postman | Redoc |
|---------|--------|------------|---------|-------|
| **Modern UI** | ✅ Excellent | ⚠️ Dated | ✅ Good | ✅ Good |
| **Interactive Testing** | ✅ Built-in | ✅ Built-in | ✅ Full client | ❌ No |
| **Performance** | ✅ Fast | ⚠️ Slow | ✅ Fast | ✅ Fast |
| **Self-hosted** | ✅ Yes | ✅ Yes | ❌ Cloud only | ✅ Yes |
| **Dark Mode** | ✅ Yes | ⚠️ Limited | ✅ Yes | ✅ Yes |
| **OpenAPI 3.1** | ✅ Yes | ⚠️ Partial | ✅ Yes | ✅ Yes |
| **Setup Complexity** | ✅ Easy | ⚠️ Medium | N/A | ✅ Easy |

---

## 🛠️ Alternative Tools (If Needed)

### 1. **Swagger UI** (Traditional)
```bash
pnpm add swagger-ui-express
```

### 2. **Redoc** (Read-only, beautiful)
```bash
pnpm add redoc-express
```

### 3. **RapiDoc** (Highly customizable)
```bash
pnpm add rapidoc
```

### 4. **Stoplight Elements** (Modern)
```bash
pnpm add @stoplight/elements
```

---

## 📊 Response Format

All endpoints follow this standardized format:

### Success (Single Item)
```json
{
  "success": true,
  "data": { /* resource */ },
  "message": "Operation successful",
  "meta": {
    "timestamp": "2026-01-26T08:20:00.000Z"
  }
}
```

### Success (Paginated)
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
  "message": "Resources retrieved",
  "meta": {
    "timestamp": "2026-01-26T08:20:00.000Z"
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-01-26T08:20:00.000Z"
  }
}
```

---

## 🎯 Best Practices

1. **Always authenticate first** - Get your token before testing protected endpoints
2. **Use the search** - Quickly find endpoints
3. **Check examples** - Each endpoint has request/response examples
4. **Test in order** - Follow the natural flow (register → login → use APIs)
5. **Save your tokens** - Use the authorize button to save tokens globally

---

## 🐛 Troubleshooting

### Documentation not loading?
```bash
# Restart the server
cd apps/api
pnpm dev
```

### Endpoints not showing?
- Check that JSDoc comments are in `src/docs/*.ts` files
- Ensure files are included in swagger config
- Restart the server

### Authentication not working?
- Make sure to use `Bearer YOUR_TOKEN` format
- Check token hasn't expired (24 hours)
- Try logging in again

---

## 📚 Resources

- **Scalar Docs**: https://github.com/scalar/scalar
- **OpenAPI Spec**: https://swagger.io/specification/
- **Your API Spec**: http://localhost:4000/api/docs/spec

---

## 🎉 Summary

You now have:
- ✅ Modern, beautiful API documentation
- ✅ Interactive testing built-in
- ✅ OpenAPI 3.1 compliant
- ✅ Self-hosted and fast
- ✅ Better than Swagger UI
- ✅ Production-ready

**Access it at:** `http://localhost:4000/api/docs`

Happy testing! 🚀
