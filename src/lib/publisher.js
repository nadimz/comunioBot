const fetch = require('node-fetch')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const FootballApi = require('./footballApi').FootballApi
const CronJob = require("cron").CronJob;

const api = new FootballApi(process.env.FOOTBALL_API_KEY)
const bot = new Telegraf(process.env.BOT_TOKEN)

const chat_id = process.env.CHAT_ID

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}

function firstDayOfRound(fixtures) {
	var earliestGame = new Date(fixtures[0].event_date)
	
	fixtures.forEach(function(fixture) {
		d = new Date(fixtures.event_date)
		if (d.getTime() < earliestGame.getTime()) {
			earliestGame = d
		}
	})
	
	var today = new Date()
	
	if ((today.getDate() == earliestGame.getDate()) &&
	    (today.getMonth() == earliestGame.getMonth())){
		console.log('First day of round')
		return true
	}
	
	return false
}

async function publishFixtures(fixtures) {
	return new Promise((resolve, reject) => {
		if (fixtures.length > 0) {
			console.log('Publish fixtures today')
			var msg = '⚽️⚽️ *Otro día de fútbol!* ⚽️⚽️\n\n'
			msg += 'Partidos hoy:\n'
			msg += '```\n'
			fixtures.forEach(function(fixture, idx) {
				var homeTeam = fixture.homeTeam.team_name
				var awayTeam = fixture.awayTeam.team_name
				index = (idx + 1).toString() + '.'
				msg += `${index.padEnd(3)} ${homeTeam} vs ${awayTeam}\n`			
			})
			msg += '```'
			
			bot.telegram.sendMessage(chat_id, msg, Extra.markdown())
			.then(() => resolve(fixtures))
			.catch((err) => reject(err))
		}		
	});
}

async function publishFirstDayOfRound(fixtures) {
	return new Promise((resolve, reject) => {
		if (firstDayOfRound(fixtures) && fixtures.length > 0) {
			console.log('Publish first day of round')
			var msg = '🏆🇪🇸 *Nueva jornada de fútbol empieza hoy!* ⚽️\n\n'
			msg += 'Partidos de esta jornada:\n'
			msg += '```\n'
			fixtures.forEach(function(fixture, idx) {
				var homeTeam = fixture.homeTeam.team_name
				var awayTeam = fixture.awayTeam.team_name
				index = (idx + 1).toString() + '.'
				msg += `${index.padEnd(3)} ${homeTeam} vs ${awayTeam}\n`			
			})
			msg += '```'
			
			bot.telegram.sendMessage(chat_id, msg, Extra.markdown())
			.then(() => resolve(fixtures))
			.catch((err) => reject(err))
		} else if (fixtures.length > 0) {
			resolve(fixtures)
		}		
	});
}

async function publishLineUps(fixture) {
	return new Promise((resolve, reject) => {
		if (fixture.lineups) {
			console.log(`Lineups for ${fixture.homeTeam.team_name} vs ${fixture.awayTeam.team_name}`)
			let msg = `✅ Alineaciones confirmados para *${fixture.homeTeam.team_name}* vs *${fixture.awayTeam.team_name}*! ⚽️\n\n`
			
			// home team			
			msg += `*${fixture.homeTeam.team_name}*\n`
			msg += '```\n'
			msg += 'XI\n'
			const homeTeam = fixture.lineups[fixture.homeTeam.team_name]
			homeTeam.startXI.forEach(function(player) {
				let number = (player.number).toString() + '.'
				msg += `${number.padEnd(3)} ${player.player}\n`
			})
			msg += `\nSubs\n`
			homeTeam.substitutes.forEach(function(player) {
				let number = (player.number).toString() + '.'
				msg += `${number.padEnd(3)} ${player.player}\n`
			})
			msg += '```\n'
			
			// away team
			msg += `\n*${fixture.awayTeam.team_name}*\n`
			msg += '```\n'
			msg += 'XI\n'
			const awayTeam = fixture.lineups[fixture.awayTeam.team_name]
			awayTeam.startXI.forEach(function(player) {
				let number = (player.number).toString() + '.'
				msg += `${number.padEnd(3)} ${player.player}\n`
			})
			msg += `\nSubs\n`
			homeTeam.substitutes.forEach(function(player) {
				let number = (player.number).toString() + '.'
				msg += `${number.padEnd(3)} ${player.player}\n`
			})
			msg += '```\n'
			
			bot.telegram.sendMessage(chat_id, msg, Extra.markdown())
			.then(() => resolve(fixture))
			.catch((err) => reject(err))
		} else {
			reject('no lineups available')
		}
	});
}

async function scheduledFixturePreview(id) {	
	console.log(`Run scheduled fixture ${id} ${new Date()}`)
	
	api.getFixtureById(id)
	.then((fixture) => publishLineUps(fixture))
	.catch(err => console.log(err));
}

function scheduleFixturesPreview(fixtures) {
	fixtures.forEach(function(fixture) {
		let date = new Date(fixture.event_date)

		console.log(`Fixture ${fixture.fixture_id} today at ${date}`)

		date.setMinutes(date.getMinutes() - 10)

		let now = new Date()
		
		if (date.getTime() > now.getTime()) {
			console.log(`Schedule fixture ${fixture.fixture_id} detail for ${date}`)
			
			const job = new CronJob(date, scheduledFixturePreview, fixture.fixture_id)
			job.start()
		}
	})
}

function scheduleDaily() {
	let date = new Date();
	date.setDate(date.getDate() + 1)
	date.setHours(10)
	date.setMinutes(15)
	
	console.log(`Schedule next daily for ${date}`)
	
	const job = new CronJob(date, daily)
	job.start()
}

async function scheduleJokeOfTheDay() {
	let date = new Date();
	console.log(`now ${date}`)
	const hours = getRandomInt(date.getHours() + 1, 22)
	const min   = getRandomInt(1, 55)	
	date.setHours(hours)
	date.setMinutes(min)
	
	console.log(`Schedule joke of the day ${date}`)
	
	const job = new CronJob(date, function() {
		console.log('fetch joke')
		fetch('https://geek-jokes.sameerkumar.website/api?format=json')
		.then((response) => response.json())
		.then((body) => {			
			let msg = '😂 *Joke of the day*\n\n'
			msg += `${body.joke}`
			bot.telegram.sendMessage(chat_id, msg, Extra.markdown())
		})
		.catch((err) => function() {
			console.log(err)
		})
	})

	job.start()
}

function daily() {
	console.log(`Running daily`)

	api.getCurrentRound()
	.then((round) => api.getFixturesInRound(round))
	.then((fixtures) => publishFirstDayOfRound(fixtures))
	.then(() => api.getFixturesToday())
	.then((fixtures) => publishFixtures(fixtures))
	.then((fixtures) => scheduleFixturesPreview(fixtures))
	.catch(err => console.log(err));

	scheduleJokeOfTheDay()

	scheduleDaily()
}

function start() {
	daily()
}

module.exports = {
    start
}