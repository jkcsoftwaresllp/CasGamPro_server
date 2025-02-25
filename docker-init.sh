#!/bin/sh

# Function to wait for MySQL to be ready
wait_for_mysql() {
    echo "Waiting for MySQL to be ready..."
    while ! nc -z $DB_HOST 3306; do
        sleep 1
    done
    echo "MySQL is ready!"
}

# Install netcat for connection checking
apk add --no-cache netcat-openbsd

# Wait for MySQL
wait_for_mysql

# Start the application
echo "Starting application..."
node server.js
