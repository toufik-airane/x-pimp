# Security policy

## Supported versions

Security fixes are applied to the latest `1.x` release.

## Reporting a vulnerability

Use the repository's private GitHub Security Advisory flow when available. Do
not open a public issue for an unpatched vulnerability and do not include
passwords, tokens, cookies, private keys, or private X.com content in a report.

Include the affected x-pimp version, the behavior you observed, and the minimum
steps needed to reproduce it. Reports are reviewed before public disclosure.

## Security model

x-pimp executes no remote code and has no developer-operated server. The
extension processes X.com content locally, stores only disclosed preferences
and feature state, and contacts Open-Meteo only for user-enabled weather.
