FROM postgres:16.0

ENV POSTGRES_DB=mydb
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword

EXPOSE 5432

# COPY /postgres/*.sql /docker-entrypoint-initdb.d/
COPY /drizzle/*.sql /docker-entrypoint-initdb.d/


# pgadmin
FROM dpage/pgadmin4:7