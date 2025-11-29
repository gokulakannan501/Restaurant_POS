# Deployment Guide for Render

This project is configured for easy deployment on [Render](https://render.com) using a Blueprint.

## Prerequisites

1. A GitHub or GitLab repository containing this project.
2. A Render account.

## Deployment Steps

1. **Push your code** to your repository.
2. Log in to your Render dashboard.
3. Click the **New +** button and select **Blueprint**.
4. Connect your repository.
5. Render will automatically detect the `render.yaml` file.
6. Click **Apply** to create the services:
   - `restaurant-pos-db`: A PostgreSQL database.
   - `restaurant-pos-backend`: The Node.js API server.
   - `restaurant-pos-frontend`: The React static site.

## Important Notes

### Database
- The project is configured to use **PostgreSQL** in production (via `render.yaml` and `schema.prisma`).
- The database connection string is automatically injected into the backend service.

### Image Uploads
- **Warning**: Render's file system is **ephemeral**. This means any images uploaded to the `/uploads` directory will be **lost** when the server restarts or redeploys.
- For a production-grade application, you should update the `upload` controller to store images in a cloud storage service like **AWS S3**, **Cloudinary**, or **Firebase Storage**.

### Environment Variables
- `VITE_API_URL` is automatically set for the frontend to point to the backend.
- `CORS_ORIGIN` is automatically set for the backend to allow requests from the frontend.
- `JWT_SECRET` is auto-generated.

## Local Development
- To run locally, ensure you have a PostgreSQL database running or switch `schema.prisma` back to `sqlite` (not recommended if you want to keep dev/prod parity).
- If using PostgreSQL locally, update your `.env` file in `backend` with the correct `DATABASE_URL`.
