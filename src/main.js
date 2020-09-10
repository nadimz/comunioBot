const fs = require('fs').promises;
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const publisher = require('./lib/publisher')
const bot = new Telegraf(process.env.BOT_TOKEN, {
						telegram: {
							agent: null,
							webhookReply: false
						}})

const chat_id = process.env.DEBUG_CHAT_ID

function getRandomInsult(player) {
	var playerInsults = [
		`A ${player} le huele la boca, debería callarse`,	
		`Con esa cabeza tan gorda no me extraña que a ${player} le baile el cerebro. Debería ponerse relleno de almohada`,
		`Lu mujer de ${player} debe disfrutar cada vez que juega. Más que nada porque por unas horas no tiene que aguantarle`,
		`Si el fútbol fuese Formula 1, ${player} sería un carro de caballos`,
		`${player} falla más que una escopeta de feria`,
		`Si tirar al centro de la portería tuviese premio, ${player} sería campeón del mundo`,
		`${player} es tan malo que no le pones ni en el FIFA`,
		`Valen más la botas de ${player} que su fútbol`,
		`${player} es feo`,
		`${player} es lento incluso con el viento a favor`,
		`Voy a denunciar a ${player} en la ONU por maltratar el balón`,
		`Además de malo ${player} es pesado`,
		`${player} juega tan mal que me desconcentra`,
		`${player} es un aborto mal hecho`,
		`${player} es mas pesado que matar un cerdo a besos`,
		`${player} es mas feo que una carretilla con pegatinas`,
		`¿${player}? Que se vaya a freír espárragos`,
		`¿${player}? Que le folle un pez`,
		`${player} es más feo que pegarle a un padre con un calcetín sudao`,
		`${player} es más feo que el Fary comiendo limones`,
		`${player} es más feo que el penal de Higuaín`,
		`${player} es tan feo que hace llorar a las cebollas`
	];
	return playerInsults[Math.floor(Math.random() * playerInsults.length)]
}

bot.use((ctx, next) => {
	next()
})

bot.hears(/benzema/i, (ctx) => {
	console.log(`reply to ${ctx.message.message_id} in ${ctx.chat.id}`)
	ctx.reply(getRandomInsult('Benzema'), Extra.inReplyTo(ctx.message.message_id))
})
	
bot.on('new_chat_members', (ctx) => ctx.reply('Hola chicos! estoy de vuelta.. a ver el hijo de p*** que me va a romper'))

bot.launch({
	webhook: {
		domain: 'https://comuniobot.herokuapp.com',
		hookPath: '/x3g3hWa22iO3268iriKyR5UmV1FuDVP5D',
		port: process.env.PORT || 5000
	}
})

publisher.start()

bot.telegram.sendMessage(chat_id, 'Back on!')