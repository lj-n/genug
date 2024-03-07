# Set the path to the SQLite database
DATABASE_PATH="/path/to/your/database.db"
# exmaple "/var/lib/docker/volumes/genug-db/_data/genug.db"

# Set the path to the backup directory
BACKUP_PATH="/path/to/your/backup/directory"

# Get the current date
CURRENT_DATE=$(date +%Y%m%d)

# Create a backup
sqlite3 $DATABASE_PATH ".backup '${BACKUP_PATH}/backup_${CURRENT_DATE}.db'"

# Delete backups older than 7 days
find $BACKUP_PATH -name "backup_*.db" -type f -mtime +7 -exec rm {} \;