
const cors = require('cors')
const express = require('express')
var session = require('express-session')

/*************************************************/

var dbconn = require('./dbconn.js')

var con = dbconn.mysql_conn()

/*************************************************/

const app = express()

app.use(cors())

app.use(express.json())

app.use(session({
	secret: process.env.session_secret,
	resave: false,
	saveUninitialized: true
}))

/*************************************************/

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})

const season = process.env.SEASON

/*************************************************/

app.get('/favicon.ico', (req, res) => {
	res.sendStatus(200)
	return
})

app.get('/authenticated', (req, res) => {
	if ("authenticated" in req.session && req.session.authenticated == true) {
		res.json({"authenticated": true})
	}
	else {
		res.json({"authenticated": false})
	}
})

/*************************************************/
// Owners

app.get('/api/owners/:owner_id', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT * FROM owners`
	query += ` WHERE owner_id=${owner_id}`

	console.log(query)

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data[0])
	})
})

app.get('/api/owners/:owner_id/current', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT * FROM ownersXseasons_current_view`
	query += ` WHERE owner_id=${owner_id}`

	console.log(query)

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data[0])
	})
})

app.get('/api/owners/:owner_id/players/:player_id', (req, res) => {

	const owner_id = req.params.owner_id
	const player_id = req.params.player_id

	let query = `INSERT INTO ownersXrosters_current (owner_id, player_id, season, drafted)`

	query += ` VALUES (${owner_id}, ${player_id}, ${season}, 1)`

	console.log(query)

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json({"status": "ok"})
	})
})

app.get('/api/owners/:owner_id/team', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT * FROM ownersXrosters_current_view AS osx, position_order AS p`
	query += ` WHERE osx.owner_id=${owner_id} AND osx.pos = p.pos ORDER BY p.o ASC`
	query += `, osx.lnf ASC`

	console.log(query)

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data)
	})
})

app.get('/api/owners/:owner_id/team_name', (req, res) => {

	const owner_id = req.params.owner_id

	let query = `SELECT team_name FROM ownersXseasons_all_time WHERE owner_id=${owner_id} ORDER BY season DESC LIMIT 1`

	console.log(query)

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data[0])
	})
})

app.post('/api/owners/:owner_id/team', (req, res) => {

	console.dir(req.headers)

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

		const team_name = con.escape(req.body.team_name)
		const salary = req.body.salary
		const bank = req.body.bank

		let query = `INSERT INTO ownersXseasons_current (owner_id, team_name, salary, bank, season)`

		query += ` VALUES (${owner_id}, ${team_name}, ${salary}, ${bank}, ${season})`

		console.log(query)

		con.query(query, function (err, data) {
			if (err) {
				console.log(err)
				res.json(err)
				return
			}
			res.json({status: "ok"})
		})
	}
})

/*************************************************/
// Players

app.get('/api/players/:player_id/current', (req, res) => {

	var player_id = req.params.player_id
	console.log(player_id)

	const query = `SELECT * FROM players_current_view WHERE player_id=${player_id}`

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		console.log(data)

		res.json(data[0])
	})
})

app.get('/api/players/:player_id/salary', (req, res) => {

	var player_id = req.params.player_id
	console.log(player_id)

	const query = `SELECT salary FROM players_current WHERE player_id=${player_id}`

	con.query(query, function (err, salary) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		console.log(salary)

		res.json(salary[0])
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

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}
		res.json(data)
	})
})

app.get('/session/clear', (req, res) => {

	delete req.session.authenticated

	res.json({"status": "ok"})
})

/*************************************************/
/* POST */

app.post('/api/trades', (req, res) => {

	if (!("authenticated" in req.session && req.session.authenticated)) {
		res.sendStatus(403)
		return
	}

	console.dir(req.body)

	const owner_id = req.body.owner_id
	const dropped_player_id = req.body.dropped_player_id
	const added_player_id = req.body.added_player_id

	let query = `SELECT salary, points FROM players_current WHERE player_id = ${added_player_id}`

	console.log(query)

	con.query(query, function (err, data) {
		if (err) {
			console.log(err)
			res.json(err)
			return
		}

		added_player_salary = data[0].salary
		added_player_points = data[0].points

		console.log(`added_player_salary: ${added_player_salary}`)

		query = `SELECT salary FROM players_current WHERE player_id = ${dropped_player_id}`

		con.query(query, function (err, data) {
			if (err) {
				console.log(err)
				res.json(err)
				return
			}

			dropped_player_salary = data[0].salary

			console.log(`dropped_player_salary: ${dropped_player_salary}`)

			let d = dayOfYear(new Date())

			query = `INSERT INTO ownersXrosters_current SET owner_id = ${owner_id}, player_id = ${added_player_id}, start_date = ${d}, acquired = 1, prev_points = ${added_player_points}`

			console.log(query)

			con.query(query, function (err, data) {
				if (err) {
					console.log(err)
					res.json(err)
					return
				}

				query = `UPDATE ownersXrosters_current SET bench_date = ${d}, benched = 1 WHERE owner_id = ${owner_id} AND player_id = ${dropped_player_id}`

				console.log(query)

				con.query(query, function (err, data) {
					if (err) {
						console.log(err)
						res.json(err)
						return
					}

					if (added_player_salary > dropped_player_salary) {

						let d = added_player_salary - dropped_player_salary

						query = `UPDATE ownersXseasons_current SET bank = (bank - ${d}) WHERE owner_id = ${owner_id}`

						console.log(query)

						con.query(query, function (err, data) {
							if (err) {
								console.log(err)
								res.json(err)
								return
							}
							res.sendStatus(200)
						})
					}
					else {
						res.sendStatus(200)
					}
				})
			})
		})
	})
})

app.post('/authenticate', (req, res) => {

	const password = req.body.password

	console.log("the password is: " + password)

	if (password.toLowerCase() == process.env.group_password.toLowerCase()) {
		req.session.authenticated = true

		res.json({"status": "ok"})
	}
	else {
		res.json({"status": "error"})
	}
})

const dayOfYear = date =>
  Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
