const fetch = require('node-fetch')
const fs    = require('fs').promises;

const dbg = process.env.DEBUG

class FootballApi {
	constructor(token) {
		this.token = token
		this.url   = 'https://api-football-v1.p.rapidapi.com/v2'
		this.timezone = process.env.TZ		
		this.league_id = 2833
	}
	
	async getSample(name) {
		return new Promise((resolve, reject) => {
			fs.readFile(`./resource/samples/${name}.json`)
			.then((data) => JSON.parse(data))
			.then((body) => resolve(body))
			.catch(err => reject(err));
		});
	}
	
	async getUrl(resource) {
		const options = {
			"method": "GET",
			"headers": {
					"x-rapidapi-host": "api-football-v1.p.rapidapi.com",
					"x-rapidapi-key": `${this.token}`,
					"useQueryString": true
				}	
		}
		
		return new Promise((resolve, reject) => {
			console.log(`fetch ${resource}`)
			fetch(`${this.url}/${resource}`, options)
			.then((response) => response.json())
			.then((body) => resolve(body))
			.catch(err => reject(err));			
		});
	}
	
	async get(name, resource) {
		return new Promise((resolve, reject) => {
			console.log(`get ${name} ${resource}`)
			if (dbg) {
				this.getSample(name)
				.then((data) => resolve(data))
				.catch(err => reject(err));
			} else {
				this.getUrl(resource)
				.then((data) => resolve(data))
				.catch(err => reject(err));
			}
		});
	}
	
	async getRounds() {
		return new Promise((resolve, reject) => {
			this.get('rounds', `fixtures/rounds/${this.league_id}`)
			.then(function(response) {
				resolve(response.api.fixtures)
			})
			.catch(err => reject(err));
		});
	}

	async getCurrentRound() {
		return new Promise((resolve, reject) => {
			this.get('round', `fixtures/rounds/${this.league_id}/current`)
			.then(function(response) {
				resolve(response.api.fixtures[0])
			})
			.catch(err => reject(err));
		});
	}
	
	async getFixturesInRound(round) {
		return new Promise((resolve, reject) => {
			this.get('fixtures', `fixtures/league/${this.league_id}/${round}?timezone=${this.timezone}`)
			.then(function(response) {
				resolve(response.api.fixtures)
			})
			.catch(err => reject(err));
		});
	}
	
	async getFixtureById(id) {
		return new Promise((resolve, reject) => {
			this.get('fixture', `fixtures/id/${id}?timezone=${this.timezone}`)
			.then(function(response) {
				resolve(response.api.fixtures[0])
			})
			.catch(err => reject(err));
		});
	}

	async getFixturesToday() {
		return new Promise((resolve, reject) => {
			const now   = new Date()
			const year  = now.getFullYear().toString()
			const month = (now.getMonth() + 1).toString().padStart(2, '0')
			const day   = now.getDate().toString().padStart(2, '0')
			this.get('today', `fixtures/league/${this.league_id}/${year}-${month}-${day}?timezone=${this.timezone}`)
			.then(function(response) {
				resolve(response.api.fixtures)
			})
			.catch(err => reject(err));
		})
	}

	async getOdds() {
		return new Promise((resolve, reject) => {
			this.get('odds', `odds/league/${this.league_id}/bookmaker/6`)
			.then(function(response) {
				resolve(response.api.odds)
			})
			.catch(err => reject(err));
		});
	}
}

module.exports = {
    FootballApi: FootballApi
}