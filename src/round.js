const config   = require('./lib/config')
const football = require('./lib/api-football')

const Fixture  = require('./fixture').Fixture

exports.Round = class Round {
    event = {
        Null: 'null' // placeholder
    }

    constructor (roundId) {
        /**
         * Musn't be called directly! Use build() instead.
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
        const data = await football.getFixturesByRound(roundId)
        if (data.api.results) {
            const buildFixtures = async (fixtures) => {
                for (const fixture of fixtures) {
                    const item = await Fixture.build(fixture.fixture_id)
                        .catch((err) => {throw err})

                        object.fixtures.push(item)
                }
            }

            await buildFixtures(data.api.fixtures)
        }

        return object
    }

    // register middleware to handle an on event
    on(event, middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function!');
        }

        this._middlewares[event].push(middleware)
    }

    followup() {
        // placeholder
    }

    isFirstDay() {
        var earliestGame = new Date(this.fixtures[0].date)

		this.fixtures.forEach(function(fixture) {
			const d = new Date(fixture.date)
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

    getFixtures() {
        return this.fixtures
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
}