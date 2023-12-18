#!/bin/sh

# This script will run migrations before starting the sveltekit webapp.
# It will create the database schema or migrate if database already exists.

npm run migrations:push
node build