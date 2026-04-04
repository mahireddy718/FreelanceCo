# Prolance Backend

## Environment Variables Required

Create a `.env` file with the following variables:

```
MONGO_CONN=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=8080
```

For password reset emails, configure one of these email options:

- Brevo: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`
- SMTP fallback: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`

If you update any of these values, restart the backend so `dotenv` reloads them.

## Local Development

```bash
npm install
npm run dev
```

## Production

```bash
npm install
npm start
```

## Deployment

This backend is configured to deploy on platforms like Render, Railway, or Vercel.

### Render Deployment

1. Push code to GitHub
2. Connect to Render
3. Set environment variables
4. Deploy

### Environment Setup

Make sure all environment variables from `.env` are configured in your deployment platform.
