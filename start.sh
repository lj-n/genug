#!/bin/sh

# This script will run drizzle migration before starting the sveltekit webapp.
# It will create the database schema or migrate if database already exists.

npm run drizzle:migrate
node build