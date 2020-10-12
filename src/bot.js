const config   = require('./lib/config')
const utils    = require('./lib/utils')

const League   = require('./comunio/league').League
const Telegraf = require('telegraf')
const Extra    = require('telegraf/extra')

const bot = new Telegraf(config.tgramBotToken)


const league = new League()

const formatFixtures = (msg, fixtures) => {
    for (const fixture of fixtures) {
        msg += utils.formatFixture(fixture)
    }

    return msg
}

const publish = async (msg) => {
    return bot.telegram.sendMessage(config.chatId, msg, Extra.markdown())
}

const publishRound = async(round, next) => {
    const fixtures = round.getFixtures()

    console.log('Publish round')

    let msg = '🏆🇪🇸 *Nueva jornada de fútbol empieza hoy!* ⚽️\n\n'

    publish(formatFixtures(msg, fixtures))
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
}

const publishGameday = async (fixtures, next) => {
    console.log('Publish fixtures today')

    let msg = '❇️ *Partidos hoy:*\n\n'

    publish(formatFixtures(msg, fixtures))
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
}

const publishLineups = async (fixture, next) => {
    console.log(`Lineups available for ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`)

    let msg = `✅ Onces confirmados en *${fixture.venue}* ⚽️\n\n`

    /**
     * Home team
     **/
    msg += `*${fixture.homeTeam.name}*  (${fixture.homeTeam.formation})\n`
    // XI
    msg += 'XI\n'
    for (const player of fixture.homeTeam.lineup) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }
    // Subs
    msg += `\nSubs\n`
    for (const player of fixture.homeTeam.substitutes) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }

    /**
     * Away team
     **/
    msg += `\n*${fixture.awayTeam.name}*  (${fixture.awayTeam.formation})\n`
    // XI
    msg += 'XI\n'
    for (const player of fixture.awayTeam.lineup) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }
    // Subs
    msg += `\nSubs\n`
    for (const player of fixture.awayTeam.substitutes) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }

    publish(msg)
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
}

const follwupFixtures = async (fixtures, next) => {
    for (const fixture of fixtures) {
        fixture.on(fixture.event.lineups, publishLineups)
        fixture.followup()
    }

    next()
}

league.on(league.event.newRound, publishRound)

league.on(league.event.gameDay, publishGameday)

league.on(league.event.gameDay, follwupFixtures)

league.followup()