const mister = require('../lib/mister')
const config = require('../lib/config')

const api = new mister.Mister(config.misterCommunityId)

test('[Mister] Login', () => {
    return api.login(config.misterEmail, config.misterPassword)
        .then(response => {
            expect(response.status).toBe(200);
        });    
});

test('[Mister] Get Gameweek', () => {
    return api.getGameWeek()
        .then(gameweek => {
            expect(gameweek).toBeDefined()
            expect(gameweek.status).toBeDefined()            
            expect(gameweek.status).toMatch('ok')
        });
});
