<p align="center">
  <img src="static/logo.svg?raw=true" height="120" alt="logo" />
</p>

<h1 align="center">
  genug
</h1>

<p align="center">
  <a href="https://github.com/lj-n/standalone-genug/actions/workflows/testing.yml">
    <img src="https://github.com/lj-n/standalone-genug/actions/workflows/testing.yml/badge.svg" />
  </a>
</p>

<p align="center">
  Budgeting with simplicity in mind. <i>genug</i> is an app for both individuals and teams that can be self-hosted.
</p>

<br />
<br />

## Features (MVP)

### Budgeting

- Transactions
- Categories
- Accounts
- Monthly Budgets
- Statistics

### Teams

- All features above can be shared in a team
- Different roles with permissions

### Administration

- Every instance has an admin
- Registration for new users can be turned off
- Teams can be turned off

## How it works

- SQLite Database
- SvelteKit with progressive enhancement (should work without javascript)
- All transactions are saved as [fractional monetary unit](https://www.thefreedictionary.com/fractional+monetary+unit)

## Install with Docker

Build the docker image with:

```sh
docker build --build-arg ORIGIN_URL=https://custom-genug.com  -t genug .
```

Create a volume to persist the database:

```sh
docker volume create genug-db
```

Start the container:

```sh
docker run -dp 127.0.0.1:3000:3000 --mount type=volume,src=genug-db,target=/app/data/ genug
```

## Updating

Create a new image and start the container. Database migrations will be run automatically.

## Development

Create a `/data` directory and run the drizzle migration. This will create a sqlite database `/data/genug.db` with the defined tables from `/src/lib/server/schema/tables.ts`.

```sh
mkdir data
npm run drizzle:migrate
```

Start the local dev server with:

```sh
npm run dev
```

### Changing database tables

The used ORM is [drizzle](https://orm.drizzle.team/).
After changes to the tables defined in `/src/lib/server/schema/tables.ts` run the following command to generate migration files.

```sh
npm run drizzle:gen
```

To apply the changes to the database run:

```sh
npm run drizzle:migrate
```
