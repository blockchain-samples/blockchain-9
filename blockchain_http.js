var initHttpServer = () => {
	var app = express();
	app.use(bodyParser.json());

	app.get('/blocks', (req, res) => res.send(JSON.stringify(blockchain)));
	app.post('/mineBlock', (req, res) => {
		var newBlock = generateNextBlock(req.body.data);
		addBlock(newBlock);
		broadcast(responseLatestMsg());
		console.log('Block added ' + JSON.stringify(newBlock));
		res.send();
	});

	app.get('/pears', (req, res) => {
		res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
	});

	app.post('/addPear', (req, res) => {
		connectToPeers([req.body.peer]);
		res.send();
	});

	app.listen(http_port, () => {
		console.log('Listening http on port ' + http_port);
	});
};