#!/bin/bash
# This script runs automatically on the first start of the MongoDB container.
# It restores the heritage_db database from the BSON dump files.
# --drop ensures existing collections are replaced with fresh data.

set -e

echo "=== Seeding heritage_db from dump ==="

# Wait for MongoDB to be ready
until mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "Waiting for MongoDB to be ready..."
  sleep 2
done

mongorestore --drop --db heritage_db /docker-entrypoint-initdb.d/heritage_db

echo "=== Verifying seed ==="
mongosh heritage_db --eval "
  var collections = db.getCollectionNames();
  print('Collections seeded: ' + collections.length);
  collections.forEach(function(c) {
    print('  ' + c + ': ' + db[c].countDocuments() + ' documents');
  });
"
echo "=== Seeding complete ==="
