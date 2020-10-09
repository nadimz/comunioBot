exports.getRandomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
}
	
exports.normalizeUnicode = (unicode) => {
	var combining = /[\u0300-\u036F]/g;
	unicode.normalize('NFKD').replace(combining, '')
	return unicode.replace('-', ' ')
}

exports.getColorFromId = (colorId) => {
	switch (colorId) {
	case 0: return '⚪️' //gray
	case 1: return '🔴'  //red
	case 2: return '🟡' //yello
	case 3: return '🟢' //green
	case 4: return '🔵' //blue
	}
}

exports.getColorFromPosition = (position) => {
	switch (position) {
	case 'G': return '🟡'  //yello
	case 'D': return '🔵' //blue
	case 'M': return '🟢'  //green
	case 'F': return '🔴' //red
	}
}

exports.sortPositions = (a, b) => {
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
}

exports.getMonth = (date) => {
	switch (date.getMonth()) {
	case 0: return 'ENE'
	case 1: return 'FEB'
	case 2: return 'MAR'
	case 3: return 'ABR'
	case 4: return 'MAY'
	case 5: return 'JUN'
	case 6: return 'JUL'
	case 7: return 'AGO'
	case 8: return 'SEP'
	case 9: return 'OCT'
	case 10: return 'NOV'
	case 11: return 'DIC'
	}
}

exports.formatFixture = (fixture, odds) => {
	let msg = `⚽️ *${fixture.homeTeam.team_name}* vs *${fixture.awayTeam.team_name}*\n`
	const date = new Date(fixture.event_date)

	if (fixture.statusShort != 'PST') {
		const gameDate = date.getDate().toString() + ' ' + this.getMonth(date)
		const time = date.getHours().toString().padEnd(2, '0') + ':' + date.getMinutes().toString().padEnd(2, '0')
		msg += `  🕣 *${gameDate} ${time}*\n\n`
	} else {
		msg += `  🕣 *Aplazado*\n\n`
	}

	return msg
}