FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Set the API URL to point to the backend container via host network
# The professor's browser will access backend at localhost:8000
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=199956172690-96c1d7747dmv25ic35ldt3ifqqpso9dq.apps.googleusercontent.com

# Build the Next.js app with the env vars baked in
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
