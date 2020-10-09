const config   = require('./lib/config')
const utils    = require('./lib/utils')

const League   = require('./league').League
const Telegraf = require('telegraf')
const Extra    = require('telegraf/extra')

const bot = new Telegraf(config.tgramBotToken)


const league = new League()

const publish = async (msg) => {
    return bot.telegram.sendMessage(config.chatId, msg, Extra.markdown())
}

const addFixtures = (msg, fixtures) => {
    for (const fixture of fixtures) {
        msg += utils.formatFixture(fixture)
    }

    return msg
}

league.on(league.event.newRound, async (round, next) => {
    const fixtures = round.getFixtures()

    console.log('Publish first day of round')
    let msg = '🏆🇪🇸 *Nueva jornada de fútbol empieza hoy!* ⚽️\n\n'

    publish(addFixtures(msg, fixtures))
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
})

league.on(league.event.gameDay, async (fixtures, next) => {
    console.log('Publish fixtures today')
    let msg = '❇️ *Partidos hoy:*\n\n'

    publish(addFixtures(msg, fixtures))
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
})