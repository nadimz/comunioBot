const config   = require('../lib/config')
const utils    = require('../lib/utils')
const football = require('../lib/api-football')

const Mister   = require('../lib/mister').Mister
const CronJob  = require("cron").CronJob;

exports.Fixture = class Fixture {
    event = {
        lineups: 'Lineups', // lineups annouced
        ratings: 'Ratings' // player ratings annouced
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
            substitutes : [],
            ratings : [],
            goals : 0
        }

        // away team
        this.awayTeam = {
            name : fixture.awayTeam.team_name,
            formation : '',
            lineup : [],
            substitutes : [],
            ratings : [],
            goals : 0
        }

        /**
         * Private
         */
        // middlewares
        this.middlewares = {
            'Lineups': [],
            'Ratings': []
        }

        this.mister = new Mister(config.misterCommunityId)
    }

    // register middleware to handle an on event
    on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this.middlewares[event].push(middleware)
    }

    async followup() {
        await this.mister.login(config.misterEmail, config.misterPassword)

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

                        this.homeTeam.formation = homeTeam.formation

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

                        this.awayTeam.formation = homeTeam.formation

                        /**
                         * Trigger event
                         */
                        this._onEvent(this.event.lineups, this)

                        /**
                         * Move to waiting for ratings
                         */
                        this._waitingForRatings(true)
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

                    return
                default:
                    /**
                     * Move to waiting for ratings
                     */
                    return this._waitingForRatings(true)
                }
            })
    }

    async _waitingForRatings(updated = false) {
        try {
            if ((updated === false) && (this.status != 'FT')) {
                /**
                 * Update fixture status
                 */
                const data = await football.getFixtureById(this.id)
                this.status = data.api.fixtures[0].statusShort
            }

            switch (this.status) {
            case 'FT':
                try {
                    const gameweek = await this.mister.getGameWeek()
                    let matchId = 0
                    let idHome = 0
                    let idAway = 0
                    for (const match of gameweek.data.matches) {
                        const home = this.homeTeam.name.indexOf(utils.normalizeUnicode(match.home))
                        const away = this.awayTeam.name.indexOf(utils.normalizeUnicode(match.away))

                        console.log('home: ' + this.homeTeam.name + ' away: ' + this.awayTeam.name)
                        console.log('home: ' + match.home + ' away: ' + match.away)

                        if (home >= 0 && away >= 0) {
                            console.log('match!')

                            // game result
                            this.homeTeam.goals = match.goals_home
                            this.awayTeam.goals = match.goals_away

                            matchId = match.id
                            idHome = match.id_home
                            idAway = match.id_away
                            break
                        }
                    }

                    this.homeTeam.ratings = [...gameweek.data.players[`${matchId}`].all[`${idHome}`]]
                    this.awayTeam.ratings = [...gameweek.data.players[`${matchId}`].all[`${idAway}`]]                    

                    /**
                     * Insure all player ratings are ready before triggering event
                     */
                    for (const player of this.homeTeam.ratings) {
                        const points = player.points.toString()
                        if (points === '?') {
                            throw 'player rating not ready'
                        }
                    }
                    for (const player of this.awayTeam.ratings) {
                        const points = player.points.toString()
                        if (points === '?') {
                            throw 'player rating not ready'
                        }
                    }

                    /**
                     * Trigger event
                     */
                    this._onEvent(this.event.ratings, this)
                } catch (err) {
                    /**
                     * Ratings not available yet. Schedule work for trying to get them again
                     */
                    let later = new Date()
                    later.setMinutes(later.getMinutes() + 5)
                    let me = this
                    const job = new CronJob({
                        cronTime: later,
                        onTick: () => {
                            me._waitingForRatings()
                        },
                        timeZome: `${config.timezone}`
                    });

                    job.start()
                }

                return
            case 'NS':
            case '1H': {
                /**
                 * Schedule work for trying to get the ratings.
                 * Fixture would typically end after 120 minutes
                 */
                let end = new Date(this.date)
                end.setMinutes(end.getMinutes() + 45 + 15 + 45 + 15)
                let me = this
                const job = new CronJob({
                    cronTime: end,
                    onTick: () => {
                        me._waitingForRatings()
                    },
                    timeZome: `${config.timezone}`
                });

                job.start()
                return
            }
            case '2H': {
                /**
                 * Fixture not over yet. Schedule work for trying to get the ratings again
                 */
                let later = new Date()
                later.setMinutes(later.getMinutes() + 10)
                let me = this
                const job = new CronJob({
                    cronTime: later,
                    onTick: () => {
                        me._waitingForRatings()
                    },
                    timeZome: `${config.timezone}`
                });

                job.start()
                return
            }
            default: {
                /**
                 * Something happened to the fixture. Stop trying to get rating
                 */
                return
            }}
        } catch (err) {
            console.log('Something happened while checking for player ratings. Aborting fixture followup: ' + err)
        }

    }
}