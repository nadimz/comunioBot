const config   = require('./lib/config')
const football = require('./lib/api-football')

const Round    = require('./round').Round
const Fixture  = require('./fixture').Fixture
const CronJob  = require("cron").CronJob;

exports.League = class League {
    event = {
        newRound: 'NewRound', // new round starts today
        gameDay:  'GameDay'   // game day
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
            'NewRound': [],
            'GameDay': [],
        }
    }

    followup() {
        this._work()
    }

    /**
     * Returns api-football fixtures response model
     * (https://www.api-football.com/documentation#fixtures-fixtures)
     */
    async getFixturesByRound(round) {
        return football.getFixturesByRound(round)
    }

    /**
     * Returns api-football fixtures response model
     * (https://www.api-football.com/documentation#fixtures-fixtures)
     */
    async getFixturesByDate(date) {
        return football.getFixturesByDate(date)
    }

    // register middleware to handle an on event
    async on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this._middlewares[event].push(middleware)
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

    async _work() {
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
            .then(async (data) => {
                if (data.api.results) {
                    const buildFixtures = async (fixtures) => {
                        for (const fixture of fixtures) {
                            const item = await Fixture.build(fixture.fixture_id)
                                .catch((err) => {throw err})

                            this.fixturesToday.push(item)
                        }
                    }

                    await buildFixtures(data.api.fixtures)

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

		let work = this._work
		const job = new CronJob({
			cronTime: date,
			onTick: work,
			timeZome: `${config.timezone}`
        });

		job.start()
    }
}