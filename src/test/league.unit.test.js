const comunio = require('../league')

const league = new comunio.League()

test('[League] Middlewares', (done) => {
    // simulated event data
    const eventData = 'RoundData'

    league.on(league.event.newRound, (round, next) => {
        expect(round).toMatch(eventData);
        next()
    })

    league.on(league.event.newRound, (round, next) => {
        expect(round).toMatch(eventData);
        next()
        done()
    })

    // trigger event
    league.onEvent(league.event.newRound, eventData)
});