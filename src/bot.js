const config   = require('./lib/config')
const utils    = require('./lib/utils')

const League   = require('./comunio/league').League
const {Telegraf} = require('telegraf')

const bot = new Telegraf(config.tgramBotToken)


const league = new League()

const formatFixtures = (msg, fixtures) => {
    for (const fixture of fixtures) {
        msg += utils.formatFixture(fixture)
    }

    return msg
}

const publish = async (msg) => {
    return bot.telegram.sendMessage(config.chatId, msg, {parse_mode: 'MarkdownV2'})
}

const pin = async (msgId) => {
    return bot.telegram.unpinAllChatMessages(config.chatId)
        .then(bot.telegram.pinChatMessage(config.chatId, msgId))
}

const publishUpcomingRound = async(upcomingRound, next) => {
    const seconds = Number(upcomingRound.ts)
    const days = Math.floor(seconds / (3600*24))

    let msg = ""
    switch (days) {
    case 0:
        msg = `❗️⏳❗️ Jornada ${upcomingRound.round} empieza *hoy*`
        break
    case 1:
        msg = `❗️⏳❗️ *Jornada ${upcomingRound.round} empieza en *mañana*`
        break
    default:
        msg = `⏳ Jornada ${upcomingRound.round} empieza en ${days} días`
        break
    }

    publish(msg)
    .then(({msgId}) => pin(msgId))
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
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

    let msg = `✅ Onces confirmados en *${fixture.venue}* 🏟\n\n`

    /**
     * XI
     */
    
    // Home team
    msg += `*${fixture.homeTeam.name}*  (${fixture.homeTeam.formation})\n`    
    for (const player of fixture.homeTeam.lineup) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }    

    // Away team
    msg += `\n*${fixture.awayTeam.name}*  (${fixture.awayTeam.formation})\n`
    for (const player of fixture.awayTeam.lineup) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }

    /**
     * Subs
     */
    msg += `*\nSubs*\n`
    // Home team
    msg += `\n${fixture.homeTeam.name}\n`
    for (const player of fixture.homeTeam.substitutes) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }

    // Away team
    msg += `\n${fixture.awayTeam.name}\n`
    for (const player of fixture.awayTeam.substitutes) {
        msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
    }

    publish(msg)
    .catch((err) => {
        console.log(err)
    })
    .finally(() => next())
}

const formatPlayerRating = (player) => {
    // points
    const points = player.points.toString()    

    let msg = `${points.padEnd(6 - points.length, ' ')}${utils.getColorFromId(player.color)}  ${player.name}`

    try {
        // events
        if (player.events != false) {
            for (const event of player.events) {
                switch (event.category) {
                    case 'sub_in':
                        msg += ` ⤴️`
                        break
                    case 'yellow':
                        msg += ` 🟨`
                        break
                    case 'red':
                        msg += ` 🟥`
                        break
                    case 'assist':
                        msg += ` 🎁`
                        break
                    case 'goal':
                        msg += ` ⚽️`
                        break
                    case 'penalty':
                        msg += ` ⚽️(penalty)`
                        break
                    case 'own_goal':
                        msg += ` ⚽️(p.p)`
                        break                
                    case 'sub_out':
                        msg += ` ⤵️`
                        break
                    default:
                        break
                }
            }        
        }
    }
    catch(err) {
        // whoops
    }

    msg += `\n`

    return msg
}

const publishRatings = async (fixture, next) => {
    console.log(`Ratings available for ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`)

    let msg = `❇️ ${fixture.homeTeam.name} *${fixture.homeTeam.goals}* : *${fixture.awayTeam.goals}* ${fixture.awayTeam.name}\n\n`

    /**
     * Home team
     */
    msg += `*${fixture.homeTeam.name}*\n`
    for (const player of fixture.homeTeam.ratings) {
        msg += formatPlayerRating(player)
    }

    /**
     * Away team
     */
    msg += `\n*${fixture.awayTeam.name}*\n`
    for (const player of fixture.awayTeam.ratings) {
        msg += formatPlayerRating(player)
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
        fixture.on(fixture.event.ratings, publishRatings)
        fixture.followup()
    }

    next()
}

league.on(league.event.upcomingRound, publishUpcomingRound)

league.on(league.event.newRound, publishRound)

league.on(league.event.gameDay, publishGameday)

league.on(league.event.gameDay, follwupFixtures)

league.followup()