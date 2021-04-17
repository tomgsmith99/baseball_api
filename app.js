
const cors = require('cors')
const express = require('express')

/*************************************************/

var dbconn = require('./dbconn.js')

/*************************************************/

const app = express()

app.use(cors())

app.use(express.json())

/*************************************************/

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})

const season = process.env.SEASON
const starting_positions_count = 12
const trades_allowed = 2

/*************************************************/
// Owners

app.get('/api/owners/:owner_id', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT * FROM owners`
	query += ` WHERE owner_id=${owner_id}`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data[0])

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

app.get('/api/owners/:owner_id/current', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT * FROM ownersXseasons_current_view`
	query += ` WHERE owner_id=${owner_id}`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data[0])

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

app.get('/api/owners/:owner_id/current/trades/count', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT COUNT(player_id) AS roster_count FROM ownersXrosters_current WHERE owner_id=${owner_id}`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		console.dir(data)

		roster_count = data[0].roster_count

		trades = roster_count - starting_positions_count

		res.json({"trades": trades})

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

	// $.getJSON(`{{{api_base}}}/api/owners/${owner_id}/current/trades/count`, function(data) {

app.get('/api/owners/:owner_id/players/:player_id', (req, res) => {

	const owner_id = req.params.owner_id
	const player_id = req.params.player_id

	let query = `INSERT INTO ownersXrosters_current (owner_id, player_id, season, drafted)`

	query += ` VALUES (${owner_id}, ${player_id}, ${season}, 1)`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		res.json({"status": "ok"})

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

app.get('/api/owners/:owner_id/team/starters', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT * FROM ownersXrosters_current_view AS osx, position_order AS p`
	query += ` WHERE osx.owner_id=${owner_id} AND benched=0 AND osx.pos = p.pos ORDER BY p.o ASC`
	query += `, osx.lnf ASC`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data)

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

app.get('/api/owners/:owner_id/team_name', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT team_name FROM ownersXseasons_all_time WHERE owner_id=${owner_id} ORDER BY season DESC LIMIT 1`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data[0])

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

app.post('/api/owners/:owner_id/team', (req, res) => {

	const authz_str = req.headers.authorization

	console.log("authz_str: " + authz_str)

	const a = authz_str.split(" ")

	const token = a[1]

	console.log("token: " + token)

	if (token != process.env.API_KEY) {
		res.sendStatus(403)
		return
	}
	else {

		console.log("the token is good!")

		const owner_id = req.params.owner_id

		console.dir(req.body)

		var connection = dbconn.mysql_conn()

		const team_name = connection.escape(req.body.team_name)
		const salary = req.body.salary
		const bank = req.body.bank

		let query = `INSERT INTO ownersXseasons_current (owner_id, team_name, salary, bank, season)`

		query += ` VALUES (${owner_id}, ${team_name}, ${salary}, ${bank}, ${season})`

		console.log(query)

		connection.query(query, function (err, data) {
			if (err) {
				console.log(err)
				res.json(err)
				return
			}
			res.json({status: "ok"})

			connection.end(function(err) {
				console.log("terminated mysql connection.")
			})
		})
	}
})

/*************************************************/
// Players

app.get('/api/players/:player_id/current', (req, res) => {

	var player_id = req.params.player_id
	console.log(player_id)

	const query = `SELECT * FROM players_current_view WHERE player_id=${player_id}`

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		console.log(data)

		res.json(data[0])

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

app.get('/api/players/:player_id/salary', (req, res) => {

	var player_id = req.params.player_id
	console.log(player_id)

	const query = `SELECT salary FROM players_current WHERE player_id=${player_id}`

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, salary) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		console.log(salary)

		res.json(salary[0])

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

/*************************************************/
// Seasons

app.get('/api/seasons/current/players?*', (req, res) => {

	const max_salary = req.query.max_salary
	const owner_id = req.query.owner_id
	const pos = req.query.pos

	let query = `SELECT * FROM players_current_view WHERE salary <= ${max_salary}`
	query += ` AND pos = '${pos}' AND player_id NOT IN (SELECT player_id FROM ownersXrosters_current_view WHERE owner_id = ${owner_id}) ORDER BY salary DESC`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data)

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

const dayOfYear = date =>
  Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
