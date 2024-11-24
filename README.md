# Mastodon to Bluesky
This is forked from [https://code.alexhyett.com/alexhyett/mastodon-to-bluesky](https://code.alexhyett.com/alexhyett/mastodon-to-bluesky) who forked from [https://github.com/mauricerenck/mastodon-to-bluesky](https://github.com/mauricerenck/mastodon-to-bluesky).
I have changed the following to have a very easy free [Koyeb](https://koyeb.com) deployment:

- Fix dockerignore to use .env
- Added Express & API endpoints to port 8000 to pass Koyeb's TCP health checks
- Handle line breaks in posts
- Handle threads with consecutive posts
- Updated the Readme to explain Koyeb free deployment

#### Crosspost from Mastodon to Bluesky

---

This scripts listens to your Mastodon account and crossposts your toots to your Bluesky account every chosen interval (minutes). It uses the Mastodon API and the Bluesky API to achieve this. The script is written in Node.js and can be run very easily on a [Koyeb](https://koyeb.com) free deployment service with a GitHub account.

---

## Configuration

Clone this repository to your GitHub account as a __private repository__.

Create a `.env` file in the root directory of the project and add the following variables:

```bash
MASTODON_INSTANCE="https://mastodon.instance"
MASTODON_USER="username"
BLUESKY_ENDPOINT="https://bsky.social"
BLUESKY_HANDLE="USERNAME.bsky.social"
BLUESKY_PASSWORD="APP_PASSWORD"
INTERVAL_MINUTES=5
```

Go to your Bluesky account, in Settings > Privacy & Security > App Passwords, create a new App Password with the name "MastodonToBluesky".

Fill the created `.env` file with your data (do not use @ for the usernames), use the newly created App Password for the Bluesky Password. 

## Free installation using [Koyeb](https://koyeb.com)

Create a free account on [Koyeb](https://koyeb.com), create a service, choose Web Service and connect with your GitHub account.

Select your cloned private repository, select the free deployment, click next and deploy!

Once the service is deployed, it should be running and crossposting every chosen interval.

## Further development

For more details see: https://maurice-renck.de/hub/tooling/crosspost-from-mastodon-to-bluesky
