const net = require('net')

const getAvailablePort = (port) => {
	return new Promise((resolve, reject) => {
		const server = net.createServer()
		server.on('error', (err) => {
			if (err.code !== 'EADDRINUSE') return reject(err)
			server.listen(++port)
		})
		server.on('listening', () => server.close(() => resolve(port)))
		server.listen(port)
	})
}

module.exports = getAvailablePort


const getPort = async () => {
	
	const port = await getAvailablePort(3003)
	// getAvailablePort(3003).then(port => { console.log(`${port} is available`)})
	console.log(port)
}

// getPort()
