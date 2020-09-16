const fetch = require('node-fetch')
const fs    = require('fs').promises;

const dbg = process.env.DEBUG

class Mister {
    constructor(login) {
        this.url = 'https://mister.mundodeportivo.com'
        this.login = login    
    }

    async getSample(name) {
		return new Promise((resolve, reject) => {
			fs.readFile(`./resource/samples/${name}.json`)
			.then((data) => JSON.parse(data))
			.then((body) => resolve(body))
			.catch(err => reject(err));
		});
    }
    
    async get(resource) {
        const options = {
			"method": "GET",
			"headers": {
                    "Cookie": `login=${this.login}`
				}	
        }
        
        return await fetch(`${this.url}/${resource}`, options);
    }

    async getSample(name) {
        return new Promise((resolve, reject) => {
            fs.readFile(`./resource/samples/${name}.json`)
            .then((data) => JSON.parse(data))
            .then((body) => resolve(body))
            .catch(err => reject(err));
        });
    }

    async post(endpoit, resource, params) {
        const options = {
			"method": "POST",
			"headers": {
                    "Cookie": `login=${this.login}`,
                    "X-Auth": `${this.authToken}`,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
            "body": params	
        }

        if (dbg) {
            return await this.getSample(endpoit)
        } else {
            const response = await fetch(`${this.url}/${resource}`, options)            
            return response.json()
        }        
    }

    async changeCommunity(community) {
        this.community = community

        const response = await this.get(`/action/change?id_community=${community}`)
        this.authToken = await this.getAuthToken()
    }

    async getAuthToken() {
        return new Promise((resolve, reject) => {
            this.get('/feed')
            .then((response) => response.text())
            .then((body) => {
                var idx = body.search('"auth"')
                var authToken = body.substr(idx + 8, 32)
                console.log(`X-Auth: ${authToken}`)
                resolve(authToken)            
            })
            .catch((err) => reject(err))
        })
    }

    async getGameWeek() {
        return new Promise((resolve, reject) => {
            const params = new URLSearchParams();
            params.append('post', 'gameweek');
            this.post('gameweek', '/ajax/sw', params)
            .then((body) => resolve(body))
            .catch((err) => reject(err))
        })
    }
}

module.exports = {
    Mister: Mister
}