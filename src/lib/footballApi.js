const fetch = require('node-fetch')
const fs    = require('fs').promises;

class FootballApi {
	constructor(token) {
		this.token = token
		this.url   = 'https://api-football-v1.p.rapidapi.com/v2'
		
		this.league_id = 2833
	}
	
	async getCached(name) {
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
			console.log(`GET ${resource}`)
			fetch(`${this.url}/${resource}`, options)
			.then((response) => response.json())
			.then((body) => resolve(body))
			.catch(err => reject(err));			
		});
	}
	
	async get(name, resource) {
		return new Promise((resolve, reject) => {
			this.getUrl(resource)
			.then((data) => resolve(data))
			.catch(err => reject(err));			
		});
	}
	
	async getCurrentRound() {
		return new Promise((resolve, reject) => {
			this.get('round', `fixtures/rounds/${this.league_id}/current`)
			.then(function(response) {
				console.log(response)
				resolve(response.api.fixtures[0])
			})
			.catch(err => reject(err));
		});
	}
	
	async getFixturesInRound(round) {
		return new Promise((resolve, reject) => {
			this.get('fixtures', `fixtures/league/${this.league_id}/${round}?timezone=Europe/Madrid`)
			.then(function(response) {
				resolve(response.api.fixtures)
			})
			.catch(err => reject(err));
		});
	}
	
	async getFixtureById(id) {
		return new Promise((resolve, reject) => {
			this.get('fixture', `fixtures/id/${id}?timezone=Europe/Madrid`)
			.then(function(response) {
				resolve(response.api.fixtures[0])
			})
			.catch(err => reject(err));
		});
	}
}

module.exports = {
    FootballApi: FootballApi
}