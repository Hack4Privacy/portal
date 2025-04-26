# `OopsieGuard`

<!-- TOC -->

- [`OopsieGuard`](#oopsieguard)
  - [Development](#development)
  - [Requirements](#requirements)
  - [Customize configuration](#customize-configuration)
  - [:warning: IMPORTANT NOTES :warning:](#warning-important-notes-warning)

<!-- /TOC -->

## Development

1. Build dev server:

    ```bash
    pnpm i
    ```

2. Run dev server (_also possible with vs code debug functionality (F5)_) :

    ```bash
    pnpm dev
    ```

## Requirements

- [Node.js](https://nodejs.org/en/) (at least v18.0.0) (recommended 20.14.0)
- [PNPM](https://pnpm.io/) (at least v10.7.0 )
- [ni](https://github.com/antfu/ni) (optional - in order to use `ni` command instead of `pnpm`)

## Customize configuration

Environment variables are loaded from `.env` files in the root directory. See [Vite Environment Variables and Modes](https://vitejs.dev/guide/env-and-mode.html) for more information.

| Variable | Description | Default on serve (locally) | Default on build |
| --- | --- | --- | --- |
| `SERVICE_URL` | URL of the API service that your application will use | '' | /api |
| `ENVIRONMENT` | Environment name | development | production |
| `PUBLIC_URL` | Public URL of the application. |  |
| `BASE_PATH` | Base path of the application | / | / |

## :warning: IMPORTANT NOTES :warning:

It's **very important** that the webapp (this portal) can be built and run locally as described below, with no extra steps:

- Clone this repo;
- Add `.env` file to my local project (see above);
- Run `pnpm i`;
- Press **F5** ("Run and Debug" in VSCode);
- Webapp starts in my local browser and can call published Dev API (without any CORS, HTTPS, Authentication redirect and/or other problems);

Other ways to run this webapp (e.g., connecting to locally run API, or connecting to test env, etc) are permitted, of course, but should be considered **additional** methods.