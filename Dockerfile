FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Make init script executable
COPY docker-init.sh .
RUN chmod +x docker-init.sh

# Expose port
EXPOSE 4320

# Use the init script as entrypoint
# CMD node server.js
CMD npm run generate && npm run migrate && node server.js 
# CMD ["./docker-init.sh"]
