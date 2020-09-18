const fetch    = require('node-fetch')
const Telegraf = require('telegraf')
const Extra    = require('telegraf/extra')
const CronJob  = require("cron").CronJob;

const FootballApi = require('./footballApi').FootballApi
const Mister = require('./mister').Mister
const utils = require('./utils').Utils

const api = new FootballApi(process.env.FOOTBALL_API_KEY)
const bot = new Telegraf(process.env.BOT_TOKEN)

const mister = new Mister(process.env.MISTER_COMMUNITY_ID)

const chatId = process.env.CHAT_ID

var Publisher = {
	publish: async function(msg) {
		return new Promise((resolve, reject) => {
			bot.telegram.sendMessage(chatId, msg, Extra.markdown())
			.then(() => resolve())
			.catch((err) => reject(err))
		})
	},

	firstDayOfRound: function(fixtures) {
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
	},
	
	publishFixtures: async function(fixtures, odds) {
		return new Promise((resolve, reject) => {
			if (fixtures.length > 0) {
				console.log('Publish fixtures today')
				var msg = '❇️ *Otro día de fútbol!*\n\n'

				fixtures.forEach(function(fixture) {
					msg += utils.formatFixture(fixture, odds)
				})
				
				this.publish(msg)
				.then(() => resolve(fixtures))
				.catch((err) => reject(err))
			}		
		});
	},

	publishFirstDayOfRound: async function(fixtures, odds) {
		return new Promise((resolve, reject) => {
			if (this.firstDayOfRound(fixtures) && fixtures.length > 0) {
				console.log('Publish first day of round')
				var msg = '🏆🇪🇸 *Nueva jornada de fútbol empieza hoy!* ⚽️\n\n'
				
				fixtures.forEach(function(fixture) {
					msg += utils.formatFixture(fixture, odds)
				})
				
				this.publish(msg)
				.then(() => resolve())
				.catch((err) => reject(err))
			} else if (fixtures.length > 0) {
				resolve()
			}		
		});
	},

	publishLineUps: async function(fixture) {
		return new Promise((resolve, reject) => {
			if (fixture.lineups) {
				console.log(`Lineups for ${fixture.homeTeam.team_name} vs ${fixture.awayTeam.team_name}`)
				let msg = `✅ Onces confirmados en *${fixture.venue}* ⚽️\n\n`
				
				// home team			
				msg += `*${fixture.homeTeam.team_name}*  (${fixture.lineups[fixture.homeTeam.team_name].formation})\n`
				msg += 'XI\n'
				const homeTeam = fixture.lineups[fixture.homeTeam.team_name]
				let startXi = homeTeam.startXI
				startXi.sort(utils.sortPositions)
				startXi.forEach(function(player) {
					let number = (player.number).toString() + '.'
					msg += `*${utils.getColorFromPosition(player.pos)}* ${player.player}\n`
				})
				msg += `\nSubs\n`
				let substitutes = homeTeam.substitutes
				substitutes.sort(utils.sortPositions)
				substitutes.forEach(function(player) {
					let number = (player.number).toString() + '.'
					msg += `*${utils.getColorFromPosition(player.pos)}*  ${player.player}\n`
				})
				
				// away team
				msg += `\n*${fixture.awayTeam.team_name}*  (${fixture.lineups[fixture.awayTeam.team_name].formation})\n`
				msg += 'XI\n'
				const awayTeam = fixture.lineups[fixture.awayTeam.team_name]
				startXi = awayTeam.startXI
				startXi.sort(utils.sortPositions)
				startXi.forEach(function(player) {
					let number = (player.number).toString() + '.'
					msg += `*${utils.getColorFromPosition(player.pos)}*  ${player.player}\n`
				})
				msg += `\nSubs\n`
				substitutes = awayTeam.substitutes
				substitutes.sort(utils.sortPositions)
				substitutes.forEach(function(player) {
					let number = (player.number).toString() + '.'
					msg += `*${utils.getColorFromPosition(player.pos)}*  ${player.player}\n`
				})
				
				this.publish(msg)
				.then(() => resolve(fixture))
				.catch((err) => reject(err))
			} else {
				reject('no lineups available')
			}
		});
	},

	scheduledFixturePoints: async function(fixture) {
		console.log(`Run scheduled fixture ${fixture.fixture_id} points ${new Date()}`)
		
		const gameweek = await mister.getGameWeek()
		let matchId = 0
		let idHome = 0
		let idAway = 0
		gameweek.data.matches.forEach(function(match) {
			const home = fixture.homeTeam.team_name.indexOf(utils.normalizeUnicode(match.home))
			const away = fixture.awayTeam.team_name.indexOf(utils.normalizeUnicode(match.away))

			if (home >= 0 && away >= 0) {				
				matchId = match.id
				console.log(`match! ${matchId}`)
				idHome = match.id_home
				idAway = match.id_away
			}
		})
		
		if (gameweek.data.players) {
			try {			
				let msg = `💹 Las puntaciones del *${fixture.homeTeam.team_name}* vs *${fixture.awayTeam.team_name}* ya están disponibles ⚽\n\n`

				console.log(`${fixture.homeTeam.team_name}`)
				msg += `*${fixture.homeTeam.team_name}*\n`
				gameweek.data.players[`${matchId}`].all[`${idHome}`].forEach(function(player) {
					console.log(`${player.name}: ${player.points}`)
					const points = player.points.toString()
					if (points === '?') {
						throw 'player rating not ready'
					}
					msg += `${points.padEnd(6 - points.length, ' ')}${utils.getColorFromId(player.color)}  ${player.name}\n`
				})

				console.log(`${fixture.awayTeam.team_name}`)
				msg += `\n*${fixture.homeTeam.team_name}*\n`
				gameweek.data.players[`${matchId}`].all[`${idAway}`].forEach(function(player) {
					console.log(`${player.name}: ${player.points}`)
					const points = player.points.toString()
					if (points === '?') {
						throw 'player rating not ready'
					}
					msg += `${points.padEnd(6 - points.length, ' ')}${utils.getColorFromId(player.color)}  ${player.name}\n`
				})
				
				bot.telegram.sendMessage(chatId, msg, Extra.markdown())
				return
			}
			catch (err) {
				console.log(`err at ${new Date()}`)
			}
		}

		fixture.pointsRetry = fixture.pointsRetry + 1
		if (fixture.pointsRetry < 20) {
			let date = new Date()
			date.setMinutes(date.getMinutes() + 2)

			console.log(`Schedule fixture ${fixture.fixture_id} points for ${date} retry ${fixture.pointsRetry}`)

			let work = Publisher.scheduledFixturePoints.bind(this, fixture)
			const job = new CronJob({
				cronTime: date,
				onTick: work,
				timeZome: `${process.env.TZ}`
			});
			job.start()	
		}		
	},

	scheduledFixturePreview: async function(fixture) {	
		console.log(`Run scheduled fixture ${fixture.fixture_id} detail ${new Date()}`)
		
		api.getFixtureById(fixture.fixture_id)
		.then((fixture) => Publisher.publishLineUps(fixture))
		.catch(err => console.log(err))

		let date = new Date(fixture.event_date)
		date.setMinutes(date.getMinutes() + 45 + 15 + 45 + 5)

		console.log(`Schedule fixture ${fixture.fixture_id} points for ${date}`)

		fixture.pointsRetry = 0

		let work = Publisher.scheduledFixturePoints.bind(this, fixture)
		const job = new CronJob({
			cronTime: date,
			onTick: work,
			timeZome: `${process.env.TZ}`
		});
		job.start()
	},

	scheduleFixturesPreview: function(fixtures) {
		fixtures.forEach(function(fixture) {
			let date = new Date(fixture.event_date)
	
			console.log(`Fixture ${fixture.fixture_id} today at ${date}`)
	
			date.setMinutes(date.getMinutes() - 10)
	
			let now = new Date()
			
			if (date.getTime() > now.getTime()) {
				console.log(`Schedule fixture ${fixture.fixture_id} detail for ${date}`)
				
				let work = Publisher.scheduledFixturePreview.bind(this, fixture)
				const job = new CronJob({
					cronTime: date,
					onTick: work,
					timeZome: `${process.env.TZ}`
				});
				job.start()
			}
		})
	},

	scheduleDaily: function() {
		let date = new Date();
		date.setDate(date.getDate() + 1)
		date.setHours(10)
		date.setMinutes(15)
		
		console.log(`Schedule next daily for ${date}`)
		
		const job = new CronJob(date, this.daily)
		job.start()
	},

	scheduleJokeOfTheDay: async function() {
		let date = new Date();
		console.log(`now ${date}`)
		const hours = utils.getRandomInt(date.getHours() + 1, 22)
		const min   = utils.getRandomInt(1, 55)	
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
				this.publish(msg)
			})
			.catch((err) => function() {
				console.log(err)
			})
		})
	
		job.start()
	},

	daily: async function() {
		console.log(`Running daily`)			
		
		await mister.login(process.env.MISTER_EMAIL, process.env.MISTER_PASSWORD)

		var roundFixtures = []
		var roundOdds = []
		
		api.getCurrentRound()
		.then((round) => api.getFixturesInRound(round))
		.then((fixtures) => {
			roundFixtures = fixtures
			return api.getOdds(roundFixtures)
		})
		.then((odds) => {
			roundOdds = odds
			return this.publishFirstDayOfRound(roundFixtures, odds)
		})
		.then((roundFixtures) => api.getFixturesToday())
		.then((today) => this.publishFixtures(today, roundOdds))
		.then((today) => this.scheduleFixturesPreview(today))
		.catch(err => console.log(err));

		this.scheduleJokeOfTheDay()

		this.scheduleDaily()
	},

	start: function() {
		this.daily()
	}
};

module.exports = {
    Publisher
}