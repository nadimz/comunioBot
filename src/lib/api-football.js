const fetch  = require('node-fetch')
const config = require('./config')

async function get(endpoint) {
    const options = {
        "method": "GET",
        "headers": {
                "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
                "x-rapidapi-key": `${config.radpiApiKey}`,
                "useQueryString": true
            }	
    }

    const url = `${config.apiFootballUrl}/${endpoint}`
    console.log(`fetch ${url}`)
    return fetch(url, options)
        .then((response) => response.json())
        .then((body) => {
            return body
        })
        .catch((err) => {throw err})
}

exports.getRounds = async () => {
    return get(`fixtures/rounds/${config.apiFootballLeagueId}`)
}

exports.getCurrentRound = async () => {
    return get(`fixtures/rounds/${config.apiFootballLeagueId}/current`)
}

exports.getFixtureById = async (id) => {
    return get(`fixtures/id/${id}?timezone=${config.timezone}`)
}

exports.getFixturesByRound = async (round) => {
    return get(`fixtures/league/${config.apiFootballLeagueId}/${round}?timezone=${config.timezone}`)
}

exports.getFixturesByDate = async (date) => {
    const year  = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day   = date.getDate().toString().padStart(2, '0')
    return get(`fixtures/league/${config.apiFootballLeagueId}/${year}-${month}-${day}?timezone=${config.timezone}`)
}