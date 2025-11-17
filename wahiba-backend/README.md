# Wahiba Bridal World - Backend API

A RESTful API built with Express.js and MySQL for managing the Wahiba Bridal World application.

## Features

- **Categories Management**: CRUD operations for dress categories
- **Dresses Management**: Complete dress inventory with colors and images
- **Appointments/Schedules**: Manage customer appointments and try-on sessions
- **Contact Messages**: Store and retrieve customer inquiries
- **Revenue Tracking**: Monthly revenue analytics
- **Banner Management**: Homepage banner images
- **About Us Images**: Gallery management for About page
- **File Upload**: Local image storage with organized folder structure

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Multer** - File upload handling
- **express-validator** - Request validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   - Copy `env.example.txt` to `.env`
   - Update the values:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=wahiba_bridal
   DB_PORT=3306
   
   PORT=5000
   NODE_ENV=development
   
   FRONTEND_URL=http://localhost:3000
   
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```

3. **Create MySQL database**:
   ```bash
   mysql -u root -p
   CREATE DATABASE wahiba_bridal;
   exit;
   ```

4. **Import database schema**:
   ```bash
   mysql -u root -p wahiba_bridal < database/schema.sql
   ```

5. **Create upload directories** (will be created automatically on first run):
   ```
   uploads/
   ├── dresses/
   ├── banners/
   └── about-us/
   ```

## Running the Server

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Dresses
- `GET /api/dresses` - Get all dresses with colors and images
- `GET /api/dresses/:id` - Get dress by ID
- `POST /api/dresses` - Create dress
- `PUT /api/dresses/:id` - Update dress
- `DELETE /api/dresses/:id` - Delete dress
- `POST /api/dresses/:id/colors` - Add color to dress
- `POST /api/dresses/colors/:colorId/images` - Upload images for color
- `DELETE /api/dresses/colors/:colorId` - Delete color
- `DELETE /api/dresses/images/:imageId` - Delete image

### Schedules (Appointments)
- `GET /api/schedules` - Get all schedules (optional query: ?status=pending)
- `GET /api/schedules/:id` - Get schedule by ID
- `POST /api/schedules` - Create schedule
- `PATCH /api/schedules/:id/status` - Update schedule status
- `DELETE /api/schedules/:id` - Delete schedule

### Contacts
- `GET /api/contacts` - Get all contact messages
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create contact message
- `DELETE /api/contacts/:id` - Delete contact

### Revenues
- `GET /api/revenues` - Get all revenue records
- `GET /api/revenues/:id` - Get revenue by ID
- `GET /api/revenues/month/:month` - Get revenue by month (YYYY-MM-DD)
- `POST /api/revenues` - Create or update revenue record
- `DELETE /api/revenues/:id` - Delete revenue

### Banners
- `GET /api/banners` - Get all banners (optional query: ?active=true)
- `GET /api/banners/:id` - Get banner by ID
- `POST /api/banners` - Upload banner (multipart/form-data)
- `PUT /api/banners/:id` - Update banner
- `DELETE /api/banners/:id` - Delete banner

### About Us Images
- `GET /api/about-us-images` - Get all about us images (optional query: ?active=true)
- `GET /api/about-us-images/:id` - Get image by ID
- `POST /api/about-us-images` - Upload image (multipart/form-data)
- `PUT /api/about-us-images/:id` - Update image
- `DELETE /api/about-us-images/:id` - Delete image

## Testing

Run the API test suite:
```bash
npm test
```

Or manually test with the test script:
```bash
node test-api.js
```

## File Upload

Images are stored locally in the `uploads` directory:
- **Dress images**: `uploads/dresses/`
- **Banner images**: `uploads/banners/`
- **About us images**: `uploads/about-us/`

Supported formats: JPEG, JPG, PNG, GIF, WEBP
Max file size: 5MB (configurable)

## Database Schema

The database includes the following tables:
- `categories` - Dress categories
- `dresses` - Main dress information
- `dress_categories` - Junction table for dress-category relationships
- `dress_colors` - Color variants for dresses
- `dress_images` - Images for each color variant
- `schedules` - Customer appointments
- `schedule_items` - Items in each appointment
- `contacts` - Contact form submissions
- `revenues` - Monthly revenue tracking
- `banners` - Homepage banners
- `about_us_images` - About page images

## Security

- Helmet.js for security headers
- CORS configured for frontend origin
- Input validation on all endpoints
- File type validation for uploads
- SQL injection prevention with parameterized queries

## Error Handling

All endpoints return consistent JSON responses:
```json
{
  "success": true/false,
  "data": {},
  "error": "error message"
}
```

## Development

For development, nodemon is configured to auto-restart the server on file changes:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in your `.env`
2. Configure your production database
3. Update `FRONTEND_URL` to your production frontend URL
4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name wahiba-api
   ```

## Support

For issues or questions, please contact the development team.




