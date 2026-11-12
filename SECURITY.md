# Security and privacy

Powerful Websites is a static site with no backend, no accounts and no database.

## What the project deliberately does not do

- No user accounts, login forms, passwords or email collection.
- No cookies. Preferences (theme, saved sites) use `localStorage` only and never leave the browser.
- No analytics, advertising pixels or third-party scripts. Fonts are bundled and served from the same origin.
- No secrets in the repository. The scan workflow uses the automatically supplied `GITHUB_TOKEN`.
- No API keys or paid services are required to run the site or the automation.

## Reporting a problem

If you find a security issue — for example a malicious site in the directory, or a
workflow permission problem — please open a private security advisory on the
repository (Security → Advisories) rather than a public issue. We aim to respond
within a few days.

## External links

Every listing links straight to the official website and opens in a new tab with
`rel="noopener noreferrer"`. Sites are operated by third parties; their content,
privacy practices and availability are outside this project's control.
