const config   = require('./lib/config')
const utils    = require('./lib/utils')
const football = require('./lib/api-football')

const CronJob  = require("cron").CronJob;

exports.Fixture = class Fixture {
    event = {
        lineups: 'Lineups' // lineups annouced
    }

    constructor(fixtureId) {
        /**
         * Musn't be called directly! Use build() instead.
         * The object needs to execute async operations
         * before being ready
         */

        /**
         * Public
         */
        this.id = fixtureId

        this.status = ''
        this.venue  = ''
        this.date   = undefined

        // home team
        this.homeTeam = {
            name : '',
            formation : '',
            lineup : [],
            substitutes : []
        }

        // away team
        this.awayTeam = {
            formation : '',
            name : '',
            lineup : [],
            substitutes : []
        }

        /**
         * Private
         */
        // middlewares
        this.middlewares = {
            'Lineups': []
        }
    }

    static async build(fixtureId) {
        const object = new Fixture(fixtureId)

        const data = await football.getFixtureById(fixtureId)

        /**
         * Update fixture data
         */
        object.status = data.api.fixtures[0].statusShort
        object.date   = new Date(data.api.fixtures[0].event_date)
        object.venue  = data.api.fixtures[0].venue

        object.homeTeam.name = data.api.fixtures[0].homeTeam.team_name
        object.awayTeam.name = data.api.fixtures[0].awayTeam.team_name

        return object
    }

    // register middleware to handle an on event
    on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this.middlewares[event].push(middleware)
    }

    followup() {
        /**
         * Move to waitingForLineups state
         */
        const now = new Date()
        let date  = new Date(this.date)

        /**
         * Lineups are available between 20 and 40 minutes before the game.
         * See: https://www.api-football.com/documentation#fixtures-lineups
         */
        date.setMinutes(date.getMinutes() - 40)

        if (date.getTime() > now.getTime()) {
            console.log(`Schedule fixture ${this.id} lineups for ${date}`)

            const job = new CronJob({
                cronTime: date,
                onTick: this._waitingForLineups,
                timeZome: `${process.env.TZ}`
            });

            job.start()
        }
    }

    /**
     * Returns api-football fixtures model
     * (https://www.api-football.com/documentation#fixtures-fixtures)
     */
    async getFixtures() {
        return api.getFixturesByRound(this.id)
    }

    _onEvent(event, arg) {
        let idx = 0;

        const next = () => {
            if (idx >= this.middlewares[event].length) {
                // done running middlewares
                return
            }

            const middleware = this.middlewares[event][idx++];
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

    async _waitingForLineups() {
        return football.getFixtureById(this.id)
            .then((data) => {
                /**
                 * Update fixture data
                 */
                this.status = data.api.fixtures[0].statusShort

                /**
                 * Check for lineups
                 */
                const fixture = data.api.fixtures[0]
                if (fixture.lineups) {
                    /**
                     * Home team
                     */
                    const homeTeam = fixture.lineups[fixture.homeTeam.team_name]

                    homeTeam.startXI.sort(utils.sortPositions)
                    homeTeam.substitutes.sort(utils.sortPositions)

                    this.homeTeam.lineup      = [...homeTeam.startXI]
                    this.homeTeam.substitutes = [...homeTeam.substitutes]

                    /**
                     * Away team
                     */
                    const awayTeam = fixture.lineups[fixture.awayTeam.team_name]

                    awayTeam.startXI.sort(utils.sortPositions)
                    awayTeam.substitutes.sort(utils.sortPositions)

                    this.awayTeam.lineup      = [...awayTeam.startXI]
                    this.awayTeam.substitutes = [...awayTeam.substitutes]

                    this._onEvent(this.event.lineups, this)

                    /**
                     * Move to waiting for ratings
                     */
                } else {
                    /**
                     * Lineups not available yet, keep waiting while the
                     * fixture has not started yet
                     */
                    if (this.status === 'NS' ) {
                        let date = new Date()
                        date.setMinutes(date.getMinutes() + 5)

                        console.log(`Schedule fixture ${this.id} lineups for ${date}`)

                        const job = new CronJob({
                            cronTime: date,
                            onTick: this._waitingForLineups,
                            timeZome: `${process.env.TZ}`
                        });

                        job.start()
                    }
                }
            })
    }
}