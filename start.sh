#!/usr/bin/env bash

npm ci
npm run drizzle:migrate
npm run build
node build