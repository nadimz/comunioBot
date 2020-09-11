const fs       = require('fs').promises;
const Telegraf = require('telegraf')
const Extra    = require('telegraf/extra')

const fun = require('./lib/utils').Fun

const bot = new Telegraf(process.env.BOT_TOKEN, {
						telegram: {
							agent: null,
							webhookReply: false
						}})

const chatId = process.env.DEBUG_CHAT_ID

bot.use((ctx, next) => {
	next()
})

bot.hears(/benzema/i, (ctx) => {
	console.log(`reply to ${ctx.message.message_id} in ${ctx.chat.id}`)
	ctx.reply(fun.getPlayerInsult('Benzema'), Extra.inReplyTo(ctx.message.message_id))
})
	
bot.on('new_chat_members', (ctx) => ctx.reply('Hola chicos!'))

bot.launch({
	webhook: {
		domain: 'https://comuniobot.herokuapp.com',
		hookPath: '/x3g3hWa22iO3268iriKyR5UmV1FuDVP5D',
		port: process.env.PORT || 5000
	}
})

bot.telegram.sendMessage(chatId, 'Back on!')