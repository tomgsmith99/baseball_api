
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

const starting_positions_count = 12
const trades_allowed = 2

const todaysDate = new Date()
const season = todaysDate.getFullYear()

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

	let query = `SELECT bank, owner_id, nickname, season FROM ownersXseasons_detail WHERE season = ${season} AND owner_id = ${owner_id}`

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

	// let query = `SELECT COUNT(player_id) AS roster_count FROM ownersXrosters_current WHERE owner_id=${owner_id}`

	let query = `SELECT COUNT(player_id) AS trades FROM owner_x_roster_detail WHERE owner_id=${owner_id} AND season = ${season} AND benched != 0`

	console.log(query)

	var connection = dbconn.mysql_conn()

	connection.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		console.dir(data)

		res.json({trades: data[0].trades})

		connection.end(function(err) {
			console.log("terminated mysql connection.")
		})
	})
})

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

	let query = `SELECT player_id, pos, team, salary, fnf FROM owner_x_roster_detail WHERE owner_id = ${owner_id} AND season = ${season} AND benched = 0 ORDER BY o ASC, salary DESC`

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

	const query = `SELECT * FROM player_x_season_detail WHERE player_id=${player_id} AND season=${season}`

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

	let query = `SELECT * FROM player_x_season_detail WHERE salary <= ${max_salary} AND pos = '${pos}' AND season = ${season} AND player_id NOT IN (SELECT player_id FROM owner_x_roster_detail WHERE owner_id = ${owner_id} AND season = ${season}) ORDER BY salary DESC`

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
