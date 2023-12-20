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
  <b>genug</b> is a self-hosting budgeting app with focus on simplicity
</p>

<br />
<br />

## Features

### Categories

Define categories such as food, rent, leisure, etc. to organize and track your expenses in a structured way.

<p align="center">
  <img src="static/docs_images/Category_Screenshot.png" alt="Screenshot of the Category Page" width="600"  />
</p>

### Transactions

Create, update or delete detailed transactions to get an accurate and up-to-date overview of your expenses.

<p align="center">
  <img src="static/docs_images/Transaction_Screenshot.png" alt="Screenshot of the Transaction Page" width="600"  />
</p>

### Accounts

Each transaction is linked to a specific account, so you can easily keep an eye on your account balances.

<p align="center">
  <img src="static/docs_images/Account_Screenshot.png" alt="Screenshot of the Account Page" width="600"  />
</p>

### Budget

Plan your spending every month for each category. Know what your money's doing.

<p align="center">
  <img src="static/docs_images/Budget_Screenshot.png" alt="Screenshot of the Budget Page" width="600"  />
</p>

### Teams (Coming soon)

This feature enables multiple users to work together on budgeting. Accounts, Categories, Transactions and Budget can be used as a team.

## How it works

- [SQLite](https://www.sqlite.org/index.html) Database with [Drizzle ORM](https://orm.drizzle.team/) for typesafety and migrations.
- [SvelteKit](https://kit.svelte.dev/) with focus on [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), every feature works without JavaScript.

## Install

1. Create a local clone of this repository or download [the latest release](https://github.com/lj-n/genug/releases)
2. Run `docker build -t genug .` to build the docker image
3. Run `docker volume create genug-db` to create a docker volume, so the database can be persisted
4. Run `docker run -dp 127.0.0.1:3000:3000 --mount type=volume,src=genug-db,target=/app/data/ genug <username> <password>` to start the container (_If you provide username and password params, a user will be created. This is optional but can be useful if user-creation is disabled in your instance._)

By default [Sveltekit will accept](https://kit.svelte.dev/docs/adapter-node#environment-variables-origin-protocolheader-and-hostheader) connections on `0.0.0.0` using port 3000. You can pass the `ORIGIN` environment variable in the docker build command like this:

```sh
docker build --build-arg ORIGIN_URL=https://my-url.com  -t genug .
```

## Updating

Pull the latest changes from the repository and repeat the steps from the install section.
Database migration will be run automatically inside the docker container.

## Development

### Prequisites

- [Node.js](https://nodejs.org/) **(v20.x or higher)**

### Setup

1. Run `npm install`
2. Run `npm run migrations:push` to create the SQLite database
3. Run `npm run dev` to start the local dev server

### Changing database tables

The used ORM is [Drizzle ORM](https://orm.drizzle.team/).
After changes to the tables defined in `/src/lib/server/schema/tables.ts` run `npm run migrations:generate` to generate migration files.
To apply these changes to the database run `npm run migrations:push`.

## Why

This app was created for personal use and learning purposes.
Everyone is free to use **genug** as they see fit.
