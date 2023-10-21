<p align="center">
  <img src="static/logo.svg?raw=true" height="180"/>
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

- the features above, can be shared in a team
- different roles with permissions

### Administration

- every instance as an admin
- registration for new users can be turned of
- teams can be turned of

## How it works

- used database is sqlite
- webapp is built with sveltekit
- all transactions amounts are saved as [fractional monetary units](https://www.thefreedictionary.com/fractional+monetary+unit)
