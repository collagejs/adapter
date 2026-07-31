# <img src="https://raw.githubusercontent.com/collagejs/core/HEAD/src/logos/collagejs-48.svg" alt="CollageJS Logo" width="48" height="48" align="left"> CollageJS Framework Adapters

This is the home for all official framework adapters for *CollageJS*, as well as the helper `@collagejs/adapter` NPM package.

## Supported Frameworks

This repository provides adapters for the following libraries or frameworks:

- [Svelte](packages/svelte/)
- [React](packages/react/)
- [Vue](packages/vue/)
- [Angular?](https://github.com/collagejs/adapter/issues/23)

> **ℹ️ My Framework Is Not Listed!**
>
> No worries.  Either:
> - [Create a petition](https://github.com/collagejs/adapter/issues/new?template=adapter-request.md) to cover your need
> - Create the adapter yourself following the [adapter development guidelines](https://collagejs.dev/guides/development-guide-for-adapters)
> - Create your core piece object with ad-hoc code for piece creation, or use `mountPiece` from `@collagejs/core` for piece mounting ([see docs](https://collagejs.dev/docs/introduction))

## Development

This is an NPM monorepo.  *Don't use yarn, don't use pnpm.*

After cloning or forking, install and build the adapter package:

```bash
npm install && npm run build:adapter
```

At this point, unit tests can be run as well as the building of the other packages.

Available scripts from the monorepo's root:

```bash
npm run clean
npm run test
npm run build:adapter
npm run build:adapters
npm run build
npm run check
```

### Contributing

Generally speaking, you should never start with a pull request.  You should raise an issue first.  We don't want you to waste time and effort on a pull request that might not be needed.  Let's talk about what your needs are first.  Maybe we already got you covered.

When contributing:

- Without touching anything, start unit testing in watch mode:
    ```bash
    npm run test:watch
    # OR
    npm run test:unit
    ```
- Raise an issue and stop working if unit testing is not passing; never work over broken code
- Check if the repository has type tests, and if it does, also run them in watch mode:
    ```bash
    npm run test:types-watch
    ```
- Ditto:  Never work on broken code so if type testing fails, stop and raise an issue

> ℹ️ Type testing is done with the excellent [tstyche](https://tstyche.org/) package.

Contribution checklist:

- [ ] Add unit testing
- [ ] Add type testing if applicable
- [ ] The PR must mention the issue or issues it covers; try to cover one issue at a time
- [ ] If documentation modification is needed, link to accompanying PR in the [docs repository](https://github.com/collagejs/docs)

### Changesets

This monorepo uses Changesets for change logs and deployments.  Make sure you add a changeset file whenever appropriate when submitting pull requests.

```bash
npm run changeset # and follow the prompts
```
