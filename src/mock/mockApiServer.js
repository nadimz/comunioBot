const config  = require('../lib/config')
const fs      = require('fs').promises;
const express = require('express');
const app     = express()
const port    = config.debugMockServerPort

let logger = function (req, res, next) {
    console.log(req.path)
    next()
}

app.use(logger)

app.get('/fixtures/rounds/\*/current', (req, res) => {
    console.log('current round')
    return fs.readFile(`./src/mock/samples/round.json`)
                .then((data) => JSON.parse(data))
                .then((body) => res.send(body))
})

app.get(`/fixtures/league/${config.apiFootballLeagueId}/${round}?timezone=${config.timezone}`, (req, res) => {
    console.log('fixtures in round')
    return fs.readFile(`./src/mock/samples/rounds.json`)
                .then((data) => JSON.parse(data))
                .then((body) => res.send(body))
})

app.get('/fixtures/league/\*', (req, res) => {
    console.log('fixtures by date')
    return fs.readFile(`./src/mock/samples/fixtures.json`)
                .then((data) => JSON.parse(data))
                .then((body) => res.send(body))
})

app.listen(port, () => {
    console.log(`Running mock server on http://localhost:${port}`)
})