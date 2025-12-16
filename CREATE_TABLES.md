# How to Create Database Tables

## Method 1: Using API Endpoint (Recommended)

1. Make sure your Next.js server is running:
   ```bash
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3001/api/db/init-schema
   ```

3. Or use curl/Postman to send a POST request:
   ```bash
   curl -X POST http://localhost:3001/api/db/init-schema
   ```

4. The API will:
   - Test database connection
   - Read the schema file
   - Create all required tables
   - Return a list of created tables

## Method 2: Using phpMyAdmin or MySQL Client

1. Open phpMyAdmin: `http://192.168.2.100/phpmyadmin/`

2. Select database: `db_IKF_AI_RESUME`

3. Go to "SQL" tab

4. Copy and paste the contents of `database/schema.sql`

5. Click "Go" to execute

## Required Tables

The following tables will be created:

1. **job_descriptions** - Stores job descriptions
2. **candidates** - Stores candidate information
3. **evaluations** - Stores resume evaluations
4. **email_logs** - Logs all email sending attempts
5. **whatsapp_logs** - Logs all WhatsApp message attempts
6. **settings** - Stores application settings

## Verify Tables

After creation, you can verify tables exist by:

1. In phpMyAdmin: Check the left sidebar for table names
2. Using API: `GET http://localhost:3001/api/db/test-connection`
3. Using SQL:
   ```sql
   SHOW TABLES;
   ```

## Database Connection Details

- Host: `192.168.2.100`
- Port: `3306`
- Database: `db_IKF_AI_RESUME`
- Username: `dbo_IKF_AI_RESUME`
- Password: `Vxazm1)zRnR3Ocmm`


