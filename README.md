# ComunioBot
Telegram bot for [BeManager](https://mister.mundodeportivo.com) Fantasy Football communities

## Features
ComunioBot's aim is to keep your communitiy up to date on league and fixutre events and help start discussions by sending notifications to your community's Telegram channel/group:
  * Get notifications when a new round is about to start with the list of fixtures in round, including date & time
  * Get daily notificaitons of all fixtures to be played in that day
  * Get notifications when fixture lineups are confirmed
  * Get notifications when player ratings are announced

## Usage
### Preparation
ComunioBot uses three API providers:
   * [API-Football](https://www.api-football.com) to get league and fixture information and events.
   * [BeManager](https://mister.mundodeportivo.com) to get player ratings
   * [Telegram Bot API](https://core.telegram.org/bots) for sending notifications to a Telegram channel/group

To use this bot, you must:
  * Be subscribed to API-Football at [RapidAPI](https://rapidapi.com/api-sports/api/api-football) and have a valid API key. API-Football provides a free plan with a limit of 100 API calls per day. The bot is optimized to use up to 100 daily API calls (normally much less).
  * Be part of a [BeManager](https://mister.mundodeportivo.com) community
  * Create a [Telegram Bot](https://core.telegram.org/bots)

### Setting the environment
Configure the bot by setting the environment variables
```shell
export TGRAM_BOT_TOKEN=<your telegram bot token>
export TGRAM_CHAT_ID=<channel/chat id>

export TZ=Europe/Madrid # your timezone

export API_FOOTBALL_LEAGUE_ID=<api-football league id>
export API_FOOTBALL_URL=https://api-football-v1.p.rapidapi.com/v2
export RAPID_API_KEY=<rapidapi key>

export MISTER_URL=https://mister.mundodeportivo.com
export MISTER_COMMUNITY_ID=<your bemanager community id>
export MISTER_EMAIL=<your bemanager email>
export MISTER_PASSWORD=<your bemanager password>
```

### Runnig the bot
```shell
// install required packages
npm install

// launch bot
node ./src/bot.js
```

## Testing
Run all test suites
```shell
npm run test
```
