# Database Setup Guide

## MySQL Database Connection

Your database credentials have been configured. Follow these steps to set up the database:

### 1. Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
DB_HOST=192.168.2.100
DB_PORT=3306
DB_NAME=db_IKF_AI_RESUME
DB_USER=dbo_IKF_AI_RESUME
DB_PASSWORD=Vxazm1)zRnR3Ocmm
```

### 2. Initialize Database Schema

You have two options:

#### Option A: Using phpMyAdmin (Recommended)
1. Open phpMyAdmin: http://192.168.2.100/phpmyadmin/index.php
2. Select database: `db_IKF_AI_RESUME`
3. Go to "SQL" tab
4. Copy and paste the contents of `database/schema.sql`
5. Click "Go" to execute

#### Option B: Using API Endpoint
1. Start your Next.js server: `npm run dev`
2. Make a POST request to: `http://localhost:3001/api/db/init-schema`
3. Or use curl:
   ```bash
   curl -X POST http://localhost:3001/api/db/init-schema
   ```

### 3. Test Database Connection

Test the connection by visiting:
```
http://localhost:3001/api/db/test-connection
```

You should see:
```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2025-12-08T..."
}
```

## Database Schema

The database includes the following tables:

1. **job_descriptions** - Stores job descriptions
2. **candidates** - Stores candidate information
3. **evaluations** - Stores evaluation results
4. **email_logs** - Tracks sent emails
5. **whatsapp_logs** - Tracks sent WhatsApp messages
6. **settings** - Application settings

## API Endpoints

### Database Operations
- `GET /api/db/test-connection` - Test database connection
- `POST /api/db/init-schema` - Initialize database schema

### Evaluations
- `POST /api/evaluations/save` - Save evaluation to database
- `GET /api/evaluations/list` - List all evaluations (with pagination and filters)

## Next Steps

1. ✅ Database connection configured
2. ✅ Schema created
3. ⏳ Initialize schema in database
4. ⏳ Update frontend to use database APIs
5. ⏳ Migrate existing localStorage data (optional)

## Troubleshooting

### Connection Issues
- Verify database server is accessible at `192.168.2.100:3306`
- Check firewall settings
- Verify credentials in `.env.local`

### Schema Issues
- Ensure database `db_IKF_AI_RESUME` exists
- Check user permissions
- Verify all tables are created successfully

