#!/usr/bin/env bash

IMAGE_NAME="postgres-16-image"
CONTAINER_NAME="postgres-16-container"

# remove existing container and image
docker rm -f $CONTAINER_NAME
docker rmi -f $IMAGE_NAME

# create image
docker build -t $IMAGE_NAME -f Dockerfile .

# start postgres container
docker run -d -p 5432:5432 --name $CONTAINER_NAME $IMAGE_NAME
