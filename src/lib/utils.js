var Utils = {
    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
	},
	
	normalizeUnicode: function(unicode) {
		var combining = /[\u0300-\u036F]/g;
		unicode.normalize('NFKD').replace(combining, '')
		return unicode.replace('-', ' ')
	},

	getColorFromId: function(colorId) {
		switch (colorId) {
		case 0: return '⚪️' //gray
		case 1: return '🔴'  //red
		case 2: return '🟡' //yello
		case 3: return '🟢' //green
		case 4: return '🔵' //blue
		}
	},

	getColorFromPosition: function(position) {
		switch (position) {
		case 'G': return '🟡'  //yello
		case 'D': return '🔵' //blue
		case 'M': return '🟢'  //green
		case 'F': return '🔴' //red
		}
	},

	sortPositions: function(a, b) {
		switch(a.pos) {
		case 'G':
			switch(b.pos) {
			case 'D': return -1
			case 'M': return -1
			case 'F': return -1
			}
		case 'D':
			switch(b.pos) {
			case 'G': return  1
			case 'M': return -1
			case 'F': return -1
			}
		case 'M':
			switch(b.pos) {
			case 'G': return  1
			case 'D': return  1
			case 'F': return -1
			}
		case 'F':
			switch(b.pos) {
			case 'G': return 1
			case 'D': return 1
			case 'M': return 1
			}
		}
	},

	formatFixture: function(fixture, odds) {
		let msg = `⚽️ *${fixture.homeTeam.team_name}* vs *${fixture.awayTeam.team_name}*\n`
		const date = new Date(fixture.event_date)

		if (fixture.statusShort != 'PST') {
			const time = date.getHours().toString().padEnd(2, '0') + ':' + date.getMinutes().toString().padEnd(2, '0')
			msg += `  🕣 *${time}* ${fixture.venue}\n`

			let oddsAvailable = false
			odds.forEach(function(entry) {						
				if (entry.fixture.fixture_id == fixture.fixture_id) {
					entry.bookmakers[0].bets.forEach(function(bet) {
						if (bet.label_id == 1) {
							oddsAvailable = true
							msg += `  💰 Bwin: *1:* ${bet.values[0].odd}  *X:* ${bet.values[1].odd}  *2:* ${bet.values[2].odd}\n\n`
						}
					})							
				}
			})

			if (oddsAvailable == false) {
				msg += `  💰 Bwin: Not available\n\n`
			}
		} else {
			msg += `  🕣 *Aplazado*\n\n`
		}

		return msg
	}
};

var Fun = {
    getPlayerInsult: function(player) {
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
    return playerInsults[Utils.getRandomInt(0, playerInsults.length - 1)]
    }
};

module.exports = {
    Fun: Fun,
    Utils: Utils
}