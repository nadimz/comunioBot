const fetch = require('node-fetch')
const config = require('./config')

exports.Mister = class Mister {
    constructor(community) {
        this.url = config.misterUrl
        this.community = community
        this.cookies = ''
    }
    
    async get(endpoint) {
        const options = {
			"method": "GET",
			"headers": {
                    "Cookie": `${this.cookies}`
				}	
        }

        const url = `${this.url}/${endpoint}`
        console.log(`fetch ${url}`)
        return fetch(url, options);
    }

    async post(endpoint, params) {
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
        
        const url = `${this.url}/${endpoint}`
        console.log(`fetch ${url}`)
        return fetch(url, options)            
    }

    async getAuthToken() {
        return this.get('feed')
            .then((response) => response.text())
            .then((body) => {
                var idx = body.search('"auth"')
                var authToken = body.substr(idx + 8, 32)
                console.log(`X-Auth: ${authToken}`)
                return authToken
            })
            .catch((err) => {
                throw err
            })
    }

    getCookies(response) {
        var cookies = ''
        let setCookies = response.headers.raw()['set-cookie']
        for (let i = 0; i < setCookies.length; i++) {
            var split = setCookies[i].split(';')          
            cookies += split[0] + '; '
        }
        console.log(cookies)
        return cookies
    }

    async changeCommunity() {
        const response = await this.get(`action/change?id_community=${this.community}`)
        this.authToken = await this.getAuthToken()
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

        const url = `${config.misterUrl}/api2/auth/signin/email`        
        const response = await fetch(url, options)
        if (response.status == 200) {
            this.cookies = this.getCookies(response)
        }
            
        return response
    }

    async getGameWeek() {
        await this.changeCommunity(this.community)
        const params = new URLSearchParams();
        params.append('post', 'gameweek');
        return this.post('/ajax/sw', params)
            .then((response) => response.json())
            .then((body) => {
                return body
            })
            .catch((err) => {
                throw err
            })
    }
}