# 1. Start with an official Node.js box (version 18, lightweight)
FROM node:22-alpine

# 2. Create a folder inside the box called /app and go there
WORKDIR /app

# 3. Copy package.json and package-lock.json first
COPY package*.json ./

# 4. Install the project dependencies inside the box
RUN npm install

# 5. Copy all the other project files into the box
COPY . .

# 6. Build the Next.js app into static files
RUN npm run build

# 7. Tell the box that the app will listen on port 3000
EXPOSE 3000

# 8. The command to start the app when the box runs
CMD ["npm", "start"]
