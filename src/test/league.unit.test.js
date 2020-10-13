const comunio = require('../comunio/league')

test('[League] Middlewares for upcoming round event', (done) => {
    const league = new comunio.League()

    // simulated event data
    const roundData = 'RoundData'

    league.on(league.event.upcomingRound, (data, next) => {
        expect(data).toMatch(roundData);
        next()
    })

    league.on(league.event.upcomingRound, (data, next) => {
        expect(data).toMatch(roundData);
        next()
        done()
    })

    // trigger event
    league._onEvent(league.event.upcomingRound, roundData)
});

test('[League] Middlewares for new round event', (done) => {
    const league = new comunio.League()

    // simulated event data
    const roundData = 'RoundData'

    league.on(league.event.newRound, (data, next) => {
        expect(data).toMatch(roundData);
        next()
    })

    league.on(league.event.newRound, (data, next) => {
        expect(data).toMatch(roundData);
        next()
        done()
    })

    // trigger event
    league._onEvent(league.event.newRound, roundData)
});

test('[League] Middlewares for gameday event', (done) => {
    const league = new comunio.League()

    // simulated event data
    const gameDayData = 'GameDayData'

    league.on(league.event.gameDay, (data, next) => {
        expect(data).toMatch(gameDayData);
        next()
    })

    league.on(league.event.gameDay, (data, next) => {
        expect(data).toMatch(gameDayData);
        next()
        done()
    })

    // trigger event
    league._onEvent(league.event.gameDay, gameDayData)
});