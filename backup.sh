#!/bin/sh

# The path to the sqlite database file.
# DB_FILE="/var/lib/docker/volumes/genug-db/_data/genug.db"
DB_FILE="./data/genug.db"

# The directory to store the backups.
BACKUP_DIR="$HOME/genug-backups"

mkdir -p $BACKUP_DIR

sqlite3 $DB_FILE ".backup $BACKUP_DIR/$(date +'%Y-%m-%d-%H-%M-%S').db"

# Delete backups older than 7 days.
find $BACKUP_DIR -type f -mtime +7 -exec rm {} \;