const config   = require('../lib/config')
const football = require('../lib/api-football')

const Round    = require('./round').Round
const Fixture  = require('./fixture').Fixture
const CronJob  = require("cron").CronJob;
const Mister   = require('../lib/mister').Mister

exports.League = class League {
    event = {
        upcomingRound:  'UpcomingRound',   // new round starts in a few days
        newRound:       'NewRound',        // new round starts today
        gameDay:        'GameDay',         // game day
    }

    constructor() {
        /**
         * Public
         */
        this.currentRound  = undefined
        this.fixturesToday = []


        /**
         * Private
         */
        // middlewares
        this._middlewares = {
            'UpcomingRound': [],
            'NewRound': [],
            'GameDay': [],
        }

        this.mister = new Mister(config.misterCommunityId)
    }

    // register middleware to handle an on event
    async on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this._middlewares[event].push(middleware)
    }

    async followup() {
        await this.mister.login(config.misterEmail, config.misterPassword)
        this._daily()
    }

    async _onEvent(event, arg) {
        let idx = 0;

        const next = () => {
            if (idx >= this._middlewares[event].length) {
                // done running middlewares
                return
            }

            const middleware = this._middlewares[event][idx++];
            setImmediate(() => {
                try {
                    // execute the middleware and rely on it to call `next()`
                    middleware(arg, next);
                } catch(err) {
                    console.log(err);
                }
            })
        }

        next()
    }

    async _daily() {
        /**
         * Upcoming round
         */
        await this.mister.getGameWeek()
            .then((response) => {
                const upcomingRound = {
                    round : response.data.gameweek.gameweek,
                    start : parseInt(response.data.gameweek.start.slice(0, response.data.gameweek.start.indexOf(' ')))
                }

                /**
                 * Trigger upcoming round event if there are three days or less
                 * until the next round
                 */
                console.log(upcomingRound.start + ' days until next round')
                if (upcomingRound.start > 0 && upcomingRound.start <= 3) {
                    this._onEvent(this.event.upcomingRound, upcomingRound)
                }
            })
            .catch((err) => console.log('Cannot get upcoming round: ' + err))

        /**
         * Current round
         */
        await football.getCurrentRound()
            .then((data) => Round.build(data.api.fixtures[0]))
            .then((round) => {
                this.currentRound = round
                if (this.currentRound.isFirstDay()) {
                    this._onEvent(this.event.newRound, this.currentRound)
                }

                return
            })
            .catch((err) => console.log('Cannot create current round: ' + err))

        /**
         * Game day
         */
        await football.getFixturesByDate(new Date())
            .then((data) => {
                if (data.api.results) {
                    for (const fixture of data.api.fixtures) {
                        this.fixturesToday.push(new Fixture(fixture))
                    }

                    this._onEvent(this.event.gameDay, this.fixturesToday)

                    return
                }
            })
            .catch((err) => console.log('Cannot create game day: ' + err))

        this._scheduleDaily()
    }

    _scheduleDaily() {
        let date = new Date();
		date.setDate(date.getDate() + 1)
		date.setHours(10)
		date.setMinutes(15)

		console.log(`Schedule next daily for ${date}`)

        let me = this
        const job = new CronJob({
            cronTime: date,
            onTick: () => {
                me._daily()
            },
            timeZome: `${config.timezone}`
        });

		job.start()
    }
}