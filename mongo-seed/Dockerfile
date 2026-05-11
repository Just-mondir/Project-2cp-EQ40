FROM mongo:7

# Copy the database dump into the image
COPY heritage_db /docker-entrypoint-initdb.d/heritage_db

# Copy the seed script that mongorestore will run on first boot
COPY seed.sh /docker-entrypoint-initdb.d/seed.sh
RUN chmod +x /docker-entrypoint-initdb.d/seed.sh
