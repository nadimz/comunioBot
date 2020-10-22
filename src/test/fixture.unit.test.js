const comunio = require('../comunio/fixture')
const utils   = require('../lib/utils')

test('[Fixture] Middlewares for lineups event', (done) => {
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

test('[Fixture] Unicode team names matching', () => {
    const homeAscii = 'Alaves'
    const awayAscii = 'Cadiz'
    const homeUtf   = 'Alavés'
    const awayUtf   = 'Cádiz'

    const homeNormalized = utils.normalizeUnicode(homeUtf)
    const awayNormalized = utils.normalizeUnicode(awayUtf)

    const home = homeAscii.indexOf(homeNormalized)
    const away = awayAscii.indexOf(awayNormalized)

    expect(home).toBeGreaterThan(-1)
    expect(away).toBeGreaterThan(-1)
});