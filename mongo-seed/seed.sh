#!/bin/bash
# This script runs automatically on the first start of the MongoDB container.
# It restores the heritage_db database from the BSON dump files.

echo "=== Seeding heritage_db from dump ==="
mongorestore --db heritage_db /docker-entrypoint-initdb.d/heritage_db
echo "=== Seeding complete ==="
