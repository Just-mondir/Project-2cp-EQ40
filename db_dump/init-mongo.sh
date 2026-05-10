#!/bin/bash
echo "Starting automatic data restoration..."
mongorestore --host=localhost --port=27017 --db=heritage_db /docker-entrypoint-initdb.d/dump/heritage_db
echo "Restoration complete!"
