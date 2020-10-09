const config   = require('./lib/config')
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
            name : ''
        }

        // away team
        this.awayTeam = {
            name : ''
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
        await object._work()
        return object
    }

    // register middleware to handle an on event
    on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this.middlewares[event].push(middleware)
    }

    /**
     * Returns api-football fixtures model
     * (https://www.api-football.com/documentation#fixtures-fixtures)
     */
    async getFixtures() {
        return api.getFixturesByRound(this.id)
    }

    onEvent(event, arg) {
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

    async _work() {
        return football.getFixtureById(this.id)
            .then((data) => {
                /**
                 * Update fixture data
                 */
                this.status = data.api.fixtures[0].statusShort 
                this.date   = new Date(data.api.fixtures[0].event_date)
                this.venue  = data.api.fixtures[0].venue
                
                this.homeTeam.name = data.api.fixtures[0].homeTeam.team_name
                this.awayTeam.name = data.api.fixtures[0].awayTeam.team_name
                
                /**
                 * Schedule next work
                 */
                let now  = new Date()
                let date = new Date(this.date)
                
                date.setMinutes(date.getMinutes() - 10)
                
                if (date.getTime() > now.getTime()) {
					console.log(`Schedule fixture ${this.id} detail for ${date}`)
					
					const job = new CronJob({
						cronTime: date,
						onTick: this._work,
						timeZome: `${process.env.TZ}`
                    });
                    
					job.start()
                }
                
                return
            })
            .catch((err) => console.log('Cannot create fixture: ' + err))
    }
}