const fetch = require('node-fetch')
const fs    = require('fs').promises;

const dbg = process.env.DEBUG

class Mister {
    constructor(community) {
        this.url = 'https://mister.mundodeportivo.com'
        this.community = community
        this.cookies = ''
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
                    "Cookie": `${this.cookies}`
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
                    "Cookie": `${this.cookies}`,
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

    async changeCommunity() {
        const response = await this.get(`action/change?id_community=${this.community}`)
        this.authToken = await this.getAuthToken()
    }

    async getAuthToken() {
        return new Promise((resolve, reject) => {
            this.get('feed')
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

    getCookies(response) {
        var cookies = ''
        var raw = response.headers.raw()['set-cookie']
        raw.forEach(function(cookie) {
          var split = cookie.split(';')          
          cookies += split[0] + '; '
        })
        console.log(cookies)
        return cookies
    }

    async login(email, password) {
        const body = `{"method":"email","email":"${email}","password":"${password}"}`
         const options = {
			"method": "POST",			
            "headers": {
                    "Content-Type": "application/json"
                },
            "body": body	
        }

        const response = await fetch('https://mister.mundodeportivo.com/api2/auth/signin/email', options)
        if (response.status == 200) {
            this.cookies = this.getCookies(response)
        }
            
        return response
    }

    async getGameWeek() {
        await this.changeCommunity(this.community)

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