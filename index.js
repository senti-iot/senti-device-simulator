// Use sctrict mode
'use strict'

require('dotenv').load()
const express = require('express')
const helmet = require('helmet')
const mqtt = require('mqtt')
const getAvailablePort = require('./getavailableport')

// read the id of the Senti.Cloud organisation out of a local .env file
// format of .env file:
// SENTI_ORG=<id of Senti.Cloud organization>

// Note that the following configuration must match with the parameters that
// the device-simulator was registered with. This device registration can
// either be done in the Senti.Cloud Device Registry dashboard or via SentiAPI

let senti = {
	"org": process.env.SENTI_ORG_ID,
	"id": process.env.SENTI_DEVICE_ID,
	"auth-token": process.env.SENTI_DEVICE_AUTHTOKEN,
	"type": process.env.SENTI_DEVICE_TYPE,
	"auth-method": "token"
}
// Name of the MQTT topic that the data should be published on
let topic = 'senti/sensor/simulator/' + senti.id

// Wait this many seconds before publishing the next set of data
let varIntervalBetweenData = 2

// Quality of Service for the publish event. Supported values : 0, 1, 2
let QosLevel = 0

const app = express()
app.use(helmet())

//---Start the express server---------------------------------------------------

// const port = server.port || process.env.SENTI_SIMULATOR_PORT || 3003

const startExpressServer = async () => {
	const port = await getAvailablePort(3000)
	// getAvailablePort(3003).then(port => { console.log(`${port} is available`)})
	app.listen(port, () => {
		console.log("Server started on " + port)
	}).on('error', (err) => {
		if (err.errno === 'EADDRINUSE') {
			console.log('Server not started, port ' + port + ' is busy')
		} else {
			console.log(err)
		}
	})
}

startExpressServer()

//---Connect to the Senti.Cloud Device Registry service--------------------------------------

// Create a client (used to send data)
// var client = new Iotf.IotfDevice(senti)

const clientId = senti.id

// Connect to the initialized iotf service
// client.connect()
let client = mqtt.connect('mqtt://hive.senti.cloud', { clientId: clientId })

// Handle errors coming from Senti.Cloud Device Registry service
client.on("error", (err) => {
	console.log(err.message)
	// console.log("Error received while connecting to Senti.Cloud Device Registry service: " + err.message)
	if (err.message.indexOf('authorized') > -1) {
		console.log('')
		console.log("Make sure the device-simulator is registered in the Senti.Cloud org with the following configuration:")
		console.log(senti)
		console.log('')
	}
	process.exit()
})

client.on("connect", () => {
	console.log("Device simulator is connected to Senti Device Registry service")
	console.log("QoS level set to: " + QosLevel)

	// inital data packet to be emitted as a JSON object
	let dataPacket = {
		"d": {
			"temperature": 17,
			"pressure": 50
		}
	}

	//--loop forever------------------------------------------------------------

	setInterval(() => {

		let date = new Date()
		dataPacket.ts = date.toISOString()

		client.publish(topic, JSON.stringify(dataPacket))
		// mqtt sub -h hive.senti.cloud -t senti/sensor/simulator/sim1

		console.log(JSON.stringify(dataPacket))

		dataPacket.d.temperature = Math.floor(Math.random() * (37 - 5 + 1)) + 5
		dataPacket.d.pressure = Math.floor(Math.random() * (100 - 40 + 1)) + 40

	}, varIntervalBetweenData * 1000)
})