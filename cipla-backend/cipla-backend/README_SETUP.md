# Backend Setup (cipla-backend)

## Prerequisites
- Node.js 18+
- MySQL running and accessible
- Cloudinary account credentials

## Environment Variables
Create a `.env` file in `cipla-backend/cipla-backend/` with:

```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=your_database_name

PORT=8080

CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud (if used)
GOOGLE_APPLICATION_CREDENTIALS=./cipla-flcmedia-videoapi-dd98eed31c02.json
```

## Install & Run
```
npm install
npm run dev
```
Server runs on `http://localhost:8080`.