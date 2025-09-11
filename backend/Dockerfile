FROM node:18-alpine

WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --verbose

# Copy source code (excluding node_modules)
COPY . .

# Create uploads and frames directories
RUN mkdir -p uploads frames

EXPOSE 3001

CMD ["npm", "start"]
