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

## Features

### Categories

Define categories such as food, rent, leisure, etc. to organize and track your expenses in a structured way.

### Transactions

Create, update or delete detailed transactions to get an accurate and up-to-date overview of your expenses.

### Accounts

Each transaction is linked to a specific account, so you can easily keep an eye on your account balances.

### Budget

Plan your spending every month for each category. Know what your money's doing.

### Teams (Coming soon)

This feature enables multiple users to work together on budgeting. Accounts, Categories, Transactions and Budget can be used as a team.

## How it works

- SQLite Database for storing data
- SvelteKit Webapp with focus on progressive enhancement

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

> By default [Sveltekit will accept](https://kit.svelte.dev/docs/adapter-node#environment-variables-origin-protocolheader-and-hostheader) connections on `0.0.0.0` using port 3000. You can pass the `ORIGIN` environment variable in the docker build like this:
>
> ```sh
> docker build --build-arg ORIGIN_URL=https://my-url.com  -t genug .
> ```

## Updating

Create a new image and start the container. Database migrations will be run automatically.

## Development

Install dependencies

```sh
npm install
```

Create a `/data` directory and run the drizzle migration. This will create a sqlite database `/data/genug.db` with the defined tables from `/src/lib/server/schema/tables.ts`.

```sh
mkdir data
npm run migrations:push
```

Start the local dev server with:

```sh
npm run dev
```

### Changing database tables

The used ORM is [drizzle](https://orm.drizzle.team/).
After changes to the tables defined in `/src/lib/server/schema/tables.ts` run the following command to generate migration files.

```sh
npm run migrations:generate
```

To apply the changes to the database run:

```sh
npm run migrations:push
```

## Why

This app was created for personal use. Everyone is free to use **genug** as they see fit.
