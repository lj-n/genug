#!/bin/sh

# Create the database schema or update if database already exists.
npm run migrations:push

# Create user if username and password params are provided.
if [ $# -eq 2 ]; then
    echo "creating user $1"
    npm run create:user -- "$1" "$2"
fi

# start the node application
node build