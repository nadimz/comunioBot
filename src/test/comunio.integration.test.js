const express = require('express');
const comunio = require('../comunio/league')
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
    fixtureById : (req, res) => {},
    changeCommunity : (req, res) => {},
    feed : (req, res) => {},
    gameweek : (req, res) => {}
}

const sampleGameweek = {
    data: {
        gameweek: {
            gameweek: 4,
            start: "4 days"
        },
        matches: [
            {
                id: 1,
                home: 'HomeTeam',
                away: 'AwayTeam',
                id_home: 1,
                id_away: 2
            },
            {
                id: 2,
                home: 'h',
                away: 'a',
                id_home: 3,
                id_away: 4
            }
        ],
        players : {
            1 : {
                all: {
                    1 : [
                        {
                            name: 'ph1',
                            points: '5'
                        },
                        {
                            name: 'ph2',
                            points: '7'
                        }
                    ],
                    2 : [
                        {
                            name: 'pa1',
                            points: '4'
                        },
                        {
                            name: 'pa2',
                            points: '2'
                        }
                    ]
                }
            }
        }
    }
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

    app.get('/action/change', (req, res) => {
        handlers.changeCommunity(req, res)
    })

    app.get('/feed', (req, res) => {
        handlers.feed(req, res)
    })

    app.post('/ajax/sw', (req, res) => {
        handlers.gameweek(req, res)
    })

    const port = config.debugMockServerPort

    server = app.listen(port, () => {
        console.log(`Running mock server on http://localhost:${port}`)
        done()
    })

    config.apiFootballUrl = `http://localhost:${port}`
    config.misterUrl      = `http://localhost:${port}`
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

    handlers.changeCommunity = (req, res) => {
        res.send()
    }

    handlers.feed = (req, res) => {
        res.send('"auth":"6845c5ceac60acfbf4367111612e98e8"')
    }

    handlers.gameweek = (req, res) => {
        res.send(JSON.stringify(sampleGameweek))
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

    league.followup()
});

test('[Comunio] Gameday in existent round', (done) => {
    /**
     * Prepare test data
     */
    const sampleRounds = {
        api: {
            results: 1,
            fixtures: []
        }
    }

    const sampleFixture1 = {
        fixture_id: 'f1',
        event_date: undefined,
        venue: 'v1',
        homeTeam: {
            team_name: 'home1'
        },
        awayTeam: {
            team_name: 'away1'
        }
    }

    const sampleFixture2 = {
        fixture_id: 'f2',
        event_date: undefined,
        venue: 'v2',
        homeTeam: {
            team_name: 'h2',
        },
        awayTeam: {
            team_name: 'a2'
        }
    }

    const sampleFixture3 = {
        fixture_id: 'f3',
        event_date: undefined,
        venue: 'v3',
        homeTeam: {
            team_name: 'h3',
        },
        awayTeam: {
            team_name: 'a3'
        }
    }

    handlers.currentRound = (req, res) => {
        let rounds = JSON.parse(JSON.stringify(sampleRounds));
        rounds.api.fixtures.push(testData.roundId)
        res.send(JSON.stringify(rounds))
    }

    const today     = new Date()
    today.setHours(today.getHours() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const f1 = JSON.parse(JSON.stringify(sampleFixture1));
    const f2 = JSON.parse(JSON.stringify(sampleFixture2));
    const f3 = JSON.parse(JSON.stringify(sampleFixture3));

    f1.event_date = yesterday.toUTCString()
    f2.event_date = today.toUTCString()
    f3.event_date = today.toUTCString()

    handlers.fixturesByRound = (req, res) => {
        const fixtures = {
            api: {
                results: 3,
                fixtures: [
                    f1,
                    f2,
                    f3
                ]
            }
        }
        res.send(JSON.stringify(fixtures))
    }

    handlers.fixturesByDate = (req, res) => {
        const fixtures = {
            api: {
                results: 2,
                fixtures: [
                    f2,
                    f3
                ]
            }
        }
        res.send(JSON.stringify(fixtures))
    }

    app.get(`/fixtures/id/${f1.fixture_id}`, (req, res) => {
        const fixtures = {
            api: {
                results: 1,
                fixtures: [
                    f1
                ]
            }
        }
        res.send(JSON.stringify(fixtures))
    })

    app.get(`/fixtures/id/${f2.fixture_id}`, (req, res) => {
        const fixtures = {
            api: {
                results: 1,
                fixtures: [
                    f2
                ]
            }
        }
        res.send(JSON.stringify(fixtures))
    })

    app.get(`/fixtures/id/${f3.fixture_id}`, (req, res) => {
        const fixtures = {
            api: {
                results: 1,
                fixtures: [
                    f3
                ]
            }
        }
        res.send(JSON.stringify(fixtures))
    })

    handlers.changeCommunity = (req, res) => {
        res.send()
    }

    handlers.feed = (req, res) => {
        res.send('"auth":"6845c5ceac60acfbf4367111612e98e8"')
    }

    handlers.gameweek = (req, res) => {
        res.send(JSON.stringify(sampleGameweek))
    }

    const league = new comunio.League()

    league.on(league.event.newRound, (round, next) => {
        throw new Error('Not expected to get here')
    })

    league.on(league.event.gameDay, (gameDayFixtures, next) => {
        expect(gameDayFixtures).toBeDefined();
        expect(gameDayFixtures.length).toBe(2)

        expect(gameDayFixtures[0].venue).toMatch(f2.venue)
        expect(gameDayFixtures[0].homeTeam).toBeDefined()
        expect(gameDayFixtures[0].awayTeam).toBeDefined()
        expect(gameDayFixtures[0].homeTeam.name).toMatch(f2.homeTeam.team_name)
        expect(gameDayFixtures[0].awayTeam.name).toMatch(f2.awayTeam.team_name)

        expect(gameDayFixtures[1].venue).toMatch(f3.venue)
        expect(gameDayFixtures[1].homeTeam).toBeDefined()
        expect(gameDayFixtures[1].awayTeam).toBeDefined()
        expect(gameDayFixtures[1].homeTeam.name).toMatch(f3.homeTeam.team_name)
        expect(gameDayFixtures[1].awayTeam.name).toMatch(f3.awayTeam.team_name)

        next()
        done()
    })

    league.followup()
});

test('[Comunio] Fixture events', (done) => {
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
    const homePlayer  = 'HomePlayer'
    const awayPlayer  = 'AwayPlayer'
    const homeSub     = 'HomeSub'
    const awaySub     = 'AwaySub'

    let fixtures =
    {
        api:
        {
            results: 1,
            fixtures: [
                {
                    fixture_id: testData.fixtureId,
                    event_date: new Date().toUTCString(),
                    statusShort: 'NS',
                    venue: venue,
                    homeTeam: {
                        team_name: homeTeam
                    },
                    awayTeam: {
                        team_name: awayTeam
                    },
                    lineups: {
                        'HomeTeam': {
                            startXI: [
                                {
                                    pos: "M",
                                    player: homePlayer
                                }
                            ],
                            substitutes: [
                                {
                                    pos: "D",
                                    player: homeSub
                                }
                            ]
                        },
                        'AwayTeam': {
                            startXI: [
                                {
                                    pos: "M",
                                    player: awayPlayer
                                }
                            ],
                            substitutes: [
                                {
                                    pos: "D",
                                    player: awaySub
                                }
                            ]
                        }
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

    handlers.changeCommunity = (req, res) => {
        res.send()
    }

    handlers.feed = (req, res) => {
        res.send('"auth":"6845c5ceac60acfbf4367111612e98e8"')
    }

    const gameweek = JSON.parse(JSON.stringify(sampleGameweek))

    handlers.gameweek = (req, res) => {
        res.send(JSON.stringify(gameweek))
    }

    /**
     * Test
     */
    const league = new comunio.League()

    league.on(league.event.gameDay, (gameDayFixtures) => {
        const fixture = gameDayFixtures[0]
        fixture.on(fixture.event.lineups, (fixture) => {
            console.log(fixture.homeTeam.lineup[0].player)
            console.log(fixture.awayTeam.lineup[0].player)
            expect(fixture.homeTeam.name).toMatch(homeTeam)
            expect(fixture.homeTeam.lineup[0].pos).toMatch('M')
            expect(fixture.homeTeam.lineup[0].player).toMatch(homePlayer)
            expect(fixture.homeTeam.substitutes[0].pos).toMatch('D')
            expect(fixture.homeTeam.substitutes[0].player).toMatch(homeSub)

            expect(fixture.awayTeam.name).toMatch(awayTeam)
            expect(fixture.awayTeam.lineup[0].pos).toMatch('M')
            expect(fixture.awayTeam.lineup[0].player).toMatch(awayPlayer)
            expect(fixture.awayTeam.substitutes[0].pos).toMatch('D')
            expect(fixture.awayTeam.substitutes[0].player).toMatch(awaySub)

            fixture.on(fixture.event.ratings, (fixture) => {
                expect(fixture.homeTeam.ratings[0].name).toMatch(gameweek.data.players['1'].all['1'][0].name)
                expect(fixture.homeTeam.ratings[0].points).toMatch(gameweek.data.players['1'].all['1'][0].points)
                expect(fixture.homeTeam.ratings[1].name).toMatch(gameweek.data.players['1'].all['1'][1].name)
                expect(fixture.homeTeam.ratings[1].points).toMatch(gameweek.data.players['1'].all['1'][1].points)

                expect(fixture.awayTeam.ratings[0].name).toMatch(gameweek.data.players['1'].all['2'][0].name)
                expect(fixture.awayTeam.ratings[0].points).toMatch(gameweek.data.players['1'].all['2'][0].points)
                expect(fixture.awayTeam.ratings[1].name).toMatch(gameweek.data.players['1'].all['2'][1].name)
                expect(fixture.awayTeam.ratings[1].points).toMatch(gameweek.data.players['1'].all['2'][1].points)

                done()
            })

            fixtures.api.fixtures[0].statusShort = 'FT'
            fixture._waitingForRatings()
        })

        // trigger fixture update
        fixture._waitingForLineups()
    })

    league.followup()
})