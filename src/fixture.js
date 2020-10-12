const config   = require('./lib/config')
const utils    = require('./lib/utils')
const football = require('./lib/api-football')

const CronJob  = require("cron").CronJob;

exports.Fixture = class Fixture {
    event = {
        lineups: 'Lineups' // lineups annouced
    }

    constructor(fixture) {
        /**
         * Public
         */
        this.id = fixture.fixture_id

        this.status = fixture.statusShort
        this.venue  = fixture.venue
        this.date   = new Date(fixture.event_date)

        // home team
        this.homeTeam = {
            name : fixture.homeTeam.team_name,
            formation : '',
            lineup : [],
            substitutes : []
        }

        // away team
        this.awayTeam = {
            name : fixture.awayTeam.team_name,
            formation : '',
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
        this._waitingForLineups()
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

    async _waitingForLineups(updated = false) {
        return football.getFixtureById(this.id)
            .then((data) => {
                /**
                 * Update fixture status
                 */
                this.status = data.api.fixtures[0].statusShort

                switch (this.status) {
                case 'NS':
                    try {
                        /**
                         * Check for lineups
                         */
                        const fixture = data.api.fixtures[0]

                        /**
                         * Home team
                         */
                        const homeTeam = fixture.lineups[fixture.homeTeam.team_name]

                        homeTeam.startXI.sort(utils.sortPositions)
                        homeTeam.substitutes.sort(utils.sortPositions)

                        this.homeTeam.lineup      = [...homeTeam.startXI]
                        this.homeTeam.substitutes = [...homeTeam.substitutes]

                        this.homeTeam.lineup.sort(utils.sortPositions)
                        this.homeTeam.substitutes.sort(utils.sortPositions)

                        /**
                         * Away team
                         */
                        const awayTeam = fixture.lineups[fixture.awayTeam.team_name]

                        awayTeam.startXI.sort(utils.sortPositions)
                        awayTeam.substitutes.sort(utils.sortPositions)

                        this.awayTeam.lineup      = [...awayTeam.startXI]
                        this.awayTeam.substitutes = [...awayTeam.substitutes]

                        this.awayTeam.lineup.sort(utils.sortPositions)
                        this.awayTeam.substitutes.sort(utils.sortPositions)

                        this._onEvent(this.event.lineups, this)

                        /**
                         * Move to waiting for ratings
                         */
                        this._waitingForRatings()
                    } catch (err) {
                        /**
                         * Schedule work for trying to get the lineups again
                         */
                        const now   = new Date()
                        const start = new Date(this.date)

                        const diffMs  = start - now; // milliseconds
                        const diffMin = Math.floor((diffMs / 1000) / 60) // minutes

                        let workTime = undefined

                        /**
                         * Lineups are available between 20 and 40 minutes before the game.
                         * See: https://www.api-football.com/documentation#fixtures-lineups
                         */
                        if (diffMin > 40) {
                            workTime = new Date(this.date)
                            workTime.setMinutes(workTime.getMinutes() - 35)
                        } else {
                            workTime = new Date()
                            workTime.setMinutes(workTime.getMinutes() + 10)
                        }

                        console.log(`Schedule fixture ${this.id} lineups for ${workTime}`)

                        let me = this
                        const job = new CronJob({
                            cronTime: workTime,
                            onTick: () => {
                                me._waitingForLineups()
                            },
                            timeZome: `${config.timezone}`
                        });

                        job.start()
                    }
                default:
                    /**
                     * Move to waiting for ratings
                     */
                    return this._waitingForRatings()
                }
            })
    }

    async _waitingForRatings() {
        return
    }
}