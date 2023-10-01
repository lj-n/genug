#!/bin/bash

fly deploy \
    --build-secret DATABASE_URL="libsql://genug-dev-lj-n.turso.io" \
    --build-secret DATABASE_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIyMDIzLTEwLTAxVDE0OjUzOjMxLjU4MzU1ODgwOFoiLCJpZCI6IjNhMDBjOTE4LTYwNGYtMTFlZS05OTAzLWJhZmU2NjdjODUwOCJ9.eSOsny8DlQcWYo9JJ9rh8X7wBPWxeUBXQVIlOx1SLe9qwsd2v9SfECOcNW0GYKh6qEaWi5TrbypIFpBg0I6_Bw"