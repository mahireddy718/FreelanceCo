# API Testing Examples

## Using cURL

### Signup Request:
```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login Request:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Using Postman or Thunder Client

### Signup:
- **Method**: POST
- **URL**: `http://localhost:8080/auth/signup`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login:
- **Method**: POST
- **URL**: `http://localhost:8080/auth/login`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Expected Responses

### Successful Signup (201):
```json
{
  "message": "Signup successful",
  "success": true
}
```

### User Already Exists (409):
```json
{
  "message": "User already exists, you can login",
  "success": false
}
```

### Successful Login (200):
```json
{
  "message": "Login successful",
  "success": true,
  "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "john@example.com",
  "name": "John Doe"
}
```

### Failed Login (403):
```json
{
  "message": "Auth failed, email or password is wrong",
  "success": false
}
```

### Validation Error (400):
```json
{
  "message": "Bad request",
  "error": "\"email\" must be a valid email"
}
```
