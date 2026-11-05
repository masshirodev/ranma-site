# ranma-site

The website of [ranma](https://github.com/masshirodev/ranma), the tiling window
manager for the terminal: [ranma.masshiro.pro](https://ranma.masshiro.pro). One
page that says what ranma is, shows it, and gets it installed.

It lives apart from ranma so that cloning ranma never downloads a website, and
the videos and screenshots that show ranma off are kept here, the README's
pictures among them (`readme/`).

## Working on it

```sh
git clone https://github.com/masshirodev/ranma ../ranma   # the build reads it
yarn install
yarn run build        # → build/
yarn run serve        # http://localhost:4173/
yarn run lint && yarn run test:coverage && yarn run test:e2e
```

- [`doc/WEBSITE.md`](doc/WEBSITE.md): how it builds, what it reads from ranma,
  how the captures are recorded, the tests, and the deploy.
- [`doc/DESIGN.md`](doc/DESIGN.md): the decisions it runs on.
- [`doc/TESTING.md`](doc/TESTING.md): what each check covers and where it runs.

## Licence

MIT or Apache-2.0, at your option, as ranma. By
[masshirodev](https://github.com/masshirodev).
