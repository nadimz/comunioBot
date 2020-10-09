const { response } = require('express');
const express = require('express');
const comunio = require('../league')
const config  = require('../lib/config')

const app  = express()

let server = undefined
let testData = {
    roundId : '',
    fixtureId: '',
    date : ''
}

let handlers = {
    currentRound : (req, res) => {},
    fixturesByRound : (req, res) => {},
    fixturesByDate : (req, res) => {},
    fixtureById : (req, res) => {}
}

let logger = function (req, res, next) {
    console.log(req.path)
    next()
}

app.use(logger)

beforeAll((done) => {
    const today   = new Date()
    const year  = today.getFullYear().toString()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day   = today.getDate().toString().padStart(2, '0')

    testData.roundId   = 'Round1'
    testData.fixtureId = 'fixture1'
    testData.date      = `${year}-${month}-${day}`

    app.get(`/fixtures/rounds/${config.apiFootballLeagueId}/current`, (req, res) => {
        handlers.currentRound(req, res)
    })

    app.get(`/fixtures/league/${config.apiFootballLeagueId}/${testData.roundId}`, (req, res) => {
        handlers.fixturesByRound(req, res)
    })

    app.get(`/fixtures/league/${config.apiFootballLeagueId}/${testData.date}`, (req, res) => {
        handlers.fixturesByDate(req, res)
    })

    app.get(`/fixtures/id/${testData.fixtureId}`, (req, res) => {
        handlers.fixtureById(req, res)
    })

    const port = config.debugMockServerPort

    server = app.listen(port, () => {
        console.log(`Running mock server on http://localhost:${port}`)
        done()
    })

    config.apiFootballUrl = `http://localhost:${port}`
});

afterAll((done) => {
    server.close(() => {
        done()
    })
})

beforeEach(() => {
    const today   = new Date()
    const year  = today.getFullYear().toString()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day   = today.getDate().toString().padStart(2, '0')

    testData.roundId   = 'Round1'
    testData.fixtureId = 'fixture1'
    testData.date      = `${year}-${month}-${day}`
})

test('[Comunio] New round & gameday', (done) => {
    /**
     * Prepare test data
     */
    const rounds =
    `{
        "api":{
            "results": 1,
            "fixtures": [
                "${testData.roundId}"
            ]
        }
    }`

    handlers.currentRound = (req, res) => {
        res.send(rounds)
    }

    const venue       = 'Venue'
    const homeTeam    = 'HomeTeam'
    const awayTeam    = 'AwayTeam'

    const fixtures =
    {
        api:
        {
            results: 1,
            fixtures: [
                {
                    fixture_id: testData.fixtureId,
                    event_date: new Date().toUTCString(),
                    venue: venue,
                    homeTeam: {
                        team_name: homeTeam
                    },
                    awayTeam: {
                        team_name: awayTeam
                    }
                }
            ]
        }
    }

    handlers.fixturesByRound = (req, res) => {
        res.send(JSON.stringify(fixtures))
    }

    handlers.fixturesByDate = (req, res) => {
        res.send(JSON.stringify(fixtures))
    }

    handlers.fixtureById = (req, res) => {
        res.send(JSON.stringify(fixtures))
    }

    /**
     * Test
     */
    const league = new comunio.League()

    league.on(league.event.newRound, (round, next) => {
        expect(round).toBeDefined();
        expect(round.id).toMatch(testData.roundId);

        const fixtures = round.getFixtures()

        expect(fixtures[0].homeTeam.name).toMatch(homeTeam)
        expect(fixtures[0].awayTeam.name).toMatch(awayTeam)

        next()
    })

    league.on(league.event.newRound, (round, next) => {
        expect(round).toBeDefined();
        expect(round.id).toMatch(testData.roundId);

        const fixtures = round.getFixtures()

        expect(fixtures[0].homeTeam.name).toMatch(homeTeam)
        expect(fixtures[0].awayTeam.name).toMatch(awayTeam)

        next()
    })

    league.on(league.event.gameDay, (gameDayFixtures, next) => {
        expect(gameDayFixtures).toBeDefined();
        expect(gameDayFixtures.length).toBe(1)
        expect(gameDayFixtures[0].venue).toMatch(venue)
        expect(gameDayFixtures[0].homeTeam).toBeDefined()
        expect(gameDayFixtures[0].awayTeam).toBeDefined()
        expect(gameDayFixtures[0].homeTeam.name).toMatch(homeTeam)
        expect(gameDayFixtures[0].awayTeam.name).toMatch(awayTeam)

        next()
        done()
    })
});

test('[Comunio] Gameday in existent round', (done) => {
    /**
     * Prepare test data
     */
    const rounds =
    `{
        "api":{
            "results": 1,
            "fixtures": [
                "${testData.roundId}"
            ]
        }
    }`

    handlers.currentRound = (req, res) => {
        res.send(rounds)
    }

    const today     = new Date()
    today.setHours(today.getHours() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const fixtures =
    {
        api:
        {
            results: 3,
            fixtures: [
                {
                    fixture_id: 'f1',
                    event_date: yesterday.toUTCString(),
                    venue: 'v1',
                    homeTeam: {
                        team_name: 'home1'
                    },
                    awayTeam: {
                        team_name: 'away1'
                    }
                },
                {
                    fixture_id: 'f2',
                    event_date: today.toUTCString(),
                    venue: 'v2',
                    homeTeam: {
                        team_name: 'h2',
                    },
                    awayTeam: {
                        team_name: 'a2'
                    }
                },
                {
                    fixture_id: 'f3',
                    event_date: today.toUTCString(),
                    venue: 'v3',
                    homeTeam: {
                        team_name: 'h3',
                    },
                    awayTeam: {
                        team_name: 'a3'
                    }
                }
            ]
        }
    }

    handlers.fixturesByRound = (req, res) => {
        res.send(JSON.stringify(fixtures))
    }

    handlers.fixturesByDate = (req, res) => {
        const data =
        {
            api:
            {
                results: 2,
                fixtures: [
                    {
                        fixture_id: 'f2',
                        event_date: today.toUTCString(),
                        venue: 'v2',
                        homeTeam: {
                            team_name: 'h2',
                        },
                        awayTeam: {
                            team_name: 'a2'
                        }
                    },
                    {
                        fixture_id: 'f3',
                        event_date: today.toUTCString(),
                        venue: 'v3',
                        homeTeam: {
                            team_name: 'h3',
                        },
                        awayTeam: {
                            team_name: 'a3'
                        }
                    }
                ]
            }
        }
        res.send(JSON.stringify(data))
    }

    app.get(`/fixtures/id/${fixtures.api.fixtures[0].fixture_id}`, (req, res) => {
        const data =
        {
            api:
            {
                results: 3,
                fixtures: [
                    {
                        fixture_id: 'f1',
                        event_date: yesterday.toUTCString(),
                        venue: 'v1',
                        homeTeam: {
                            team_name: 'home1'
                        },
                        awayTeam: {
                            team_name: 'away1'
                        }
                    }
                ]
            }
        }
        res.send(JSON.stringify(data))
    })

    app.get(`/fixtures/id/${fixtures.api.fixtures[1].fixture_id}`, (req, res) => {
        const data =
        {
            api:
            {
                results: 2,
                fixtures: [
                    {
                        fixture_id: 'f2',
                        event_date: today.toUTCString(),
                        venue: 'v2',
                        homeTeam: {
                            team_name: 'h2',
                        },
                        awayTeam: {
                            team_name: 'a2'
                        }
                    }
                ]
            }
        }
        res.send(JSON.stringify(data))
    })

    app.get(`/fixtures/id/${fixtures.api.fixtures[2].fixture_id}`, (req, res) => {
        const data =
        {
            api:
            {
                results: 2,
                fixtures: [
                    {
                        fixture_id: 'f3',
                        event_date: today.toUTCString(),
                        venue: 'v3',
                        homeTeam: {
                            team_name: 'h3',
                        },
                        awayTeam: {
                            team_name: 'a3'
                        }
                    }
                ]
            }
        }
        res.send(JSON.stringify(data))
    })

    const league = new comunio.League()

    league.on(league.event.newRound, (round, next) => {
        throw new Error('Not expected to get here')
    })

    league.on(league.event.gameDay, (gameDayFixtures, next) => {
        expect(gameDayFixtures).toBeDefined();
        expect(gameDayFixtures.length).toBe(2)

        expect(gameDayFixtures[0].venue).toMatch(fixtures.api.fixtures[1].venue)
        expect(gameDayFixtures[0].homeTeam).toBeDefined()
        expect(gameDayFixtures[0].awayTeam).toBeDefined()
        expect(gameDayFixtures[0].homeTeam.name).toMatch(fixtures.api.fixtures[1].homeTeam.team_name)
        expect(gameDayFixtures[0].awayTeam.name).toMatch(fixtures.api.fixtures[1].awayTeam.team_name)

        expect(gameDayFixtures[1].venue).toMatch(fixtures.api.fixtures[2].venue)
        expect(gameDayFixtures[1].homeTeam).toBeDefined()
        expect(gameDayFixtures[1].awayTeam).toBeDefined()
        expect(gameDayFixtures[1].homeTeam.name).toMatch(fixtures.api.fixtures[2].homeTeam.team_name)
        expect(gameDayFixtures[1].awayTeam.name).toMatch(fixtures.api.fixtures[2].awayTeam.team_name)

        next()
        done()
    })
});