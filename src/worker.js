const config   = require('./lib/config')
const utils    = require('./lib/utils')

const League   = require('./league').League
const Telegraf = require('telegraf')
const Extra    = require('telegraf/extra')

const bot = new Telegraf(config.tgramBotToken)


const league = new League()

async function publish(msg) {
    return bot.telegram.sendMessage(config.chatId, msg, Extra.markdown())
}

league.on(league.event.newRound, async (round, next) => {
    round.getFixtures()
    .then((data) => {
        const fixtures = data.api.fixtures

        console.log('Publish first day of round')
        var msg = '🏆🇪🇸 *Nueva jornada de fútbol empieza hoy!* ⚽️\n\n'
        
        fixtures.forEach(function(fixture) {
            msg += utils.formatFixture(fixture)
        })
    })

    await publish(msg)

    next()
})