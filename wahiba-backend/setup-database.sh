set -e

echo "🚀 Wahiba Bridal World - Database Setup"
echo "========================================"
echo ""

# Configuration
DB_USER="wahiba_app"
DB_PASSWORD="Wahiba@SQL_2025!"
DB_NAME="wahiba_db"
DB_HOST="127.0.0.1"
DB_PORT="3306"

# Check if MySQL is running
echo "📊 Checking MySQL connection..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
    echo "✅ MySQL is running and accessible"
else
    echo "❌ Cannot connect to MySQL!"
    echo ""
    echo "Please make sure MySQL is:"
    echo "1. Installed on your system"
    echo "2. Running (brew services start mysql)"
    echo "3. User '$DB_USER' exists with password"
    echo "4. Port $DB_PORT is accessible"
    echo ""
    echo "To create the database user, run:"
    echo "  mysql -u root -p"
    echo "  CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
    echo "  CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "  GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
    echo "  FLUSH PRIVILEGES;"
    echo ""
    exit 1
fi

# Create database if not exists
echo ""
echo "🗄️  Creating database '$DB_NAME' if not exists..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

# Run schema
echo ""
echo "📋 Running database schema..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema created successfully"
else
    echo "❌ Failed to create schema"
    exit 1
fi
