const config   = require('./lib/config')
const football = require('./lib/api-football')

exports.Round = class Round {
    event = {
        Null: 'null' // placeholder
    }   

    constructor (roundId) {
        /**
         * Don't be called directly! Use build() instead.
         * The object needs to execute async operations
         * before being ready
         */

        /**
         * Public
         */
        this.id       = roundId
        this.fixtures = []

        /**
         * Private
         */
        // middlewares
        this._middlewares = {
            'null': []
        }
    }

    static async build(roundId) {        
        const object = new Round(roundId)        
        await object._work()
        return object
    }

    // register middleware to handle an on event
    on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this._middlewares[event].push(middleware)
    }

    isFirstDay() {
        var earliestGame = new Date(this.fixtures[0].event_date)
		
		this.fixtures.forEach(function(fixture) {
			const d = new Date(fixture.event_date)
			if (d.getTime() < earliestGame.getTime()) {
				earliestGame = d
			}
		})
		
		var today = new Date()
		
		if ((today.getDate() == earliestGame.getDate()) &&
			(today.getMonth() == earliestGame.getMonth())){
			console.log('First day of round')
			return true
		}        
        
		return false
    }

    /**
     * Returns api-football fixtures response model
     * (https://www.api-football.com/documentation#fixtures-fixtures)
     */
    async getFixtures() {
        return football.getFixturesByRound(this.id)
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

    async _work() {
        return football.getFixturesByRound(this.id)
            .then((data) => {
                this.fixtures = data.api.fixtures
                return
            })        
            .catch((err) => 'Cannot create round: ' + err)
    }
}