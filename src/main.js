const fs = require('fs').promises;
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const publisher = require('./lib/publisher')
const bot = new Telegraf(process.env.BOT_TOKEN)

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
	//console.log(`Update from chat ${ctx.message.chat.title}. chat id: ${ctx.message.chat.id}`)
	fs.writeFile(`./resource/samples/comunioBot.log`, `msg from ${ctx.message.chat.id}`)
	.then()
	.catch()
	
	next()
})

bot.hears(/benzema/i, (ctx) => {
	ctx.reply(getRandomInsult('Benzema'), Extra.inReplyTo(ctx.message.message_id))
	})
	
bot.on('new_chat_members', (ctx) => ctx.reply('Hola chicos!'))

bot.launch()

publisher.start()