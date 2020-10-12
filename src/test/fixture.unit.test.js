const comunio = require('../comunio/fixture')

test('[League] Middlewares for lineups event', (done) => {
    const data = {
        fixture_id: '',
        statusShort: '',
        venue: '',
        event_date: '',
        homeTeam: {
            team_name: ''
        },
        awayTeam: {
            team_name: ''
        }
    }

    const fixture = new comunio.Fixture(data)

    // simulated event data
    const eventData = 'FixtureData'

    fixture.on(fixture.event.lineups, (fixture, next) => {
        expect(fixture).toMatch(eventData);
        next()
    })

    fixture.on(fixture.event.lineups, (fixture, next) => {
        expect(fixture).toMatch(eventData);
        next()
        done()
    })

    // trigger event
    fixture._onEvent(fixture.event.lineups, eventData)
});