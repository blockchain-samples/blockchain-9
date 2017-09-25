'use strict';

var _helper = require('./helper');

var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");

var helper = new _helper.Helper();

var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

var queryChainLengthMsg = function queryChainLengthMsg() {
    return { 'type': MessageType.QUERY_LATEST };
};
var sockets = [];

exports.initHttpServer = function (http_port) {
    var app = express();
    app.use(bodyParser.json());

    app.get('/blocks', function (req, res) {
        return res.send(JSON.stringify(blockchain));
    });
    app.post('/mineBlock', function (req, res) {
        var newBlock = helper.generateNextBlock(req.body.data);
        helper.addBlock(newBlock);
        broadcast(responseLatestMsg());
        console.log('Block added ' + JSON.stringify(newBlock));
        res.send();
    });

    app.get('/pears', function (req, res) {
        res.send(sockets.map(function (s) {
            return s._socket.remoteAddress + ':' + s._socket.remotePort;
        }));
    });

    app.post('/addPear', function (req, res) {
        connectToPeers([req.body.peer]);
        res.send();
    });

    app.listen(http_port, function () {
        console.log('Listening http on port ' + http_port);
    });
};

var responseChainMsg = function responseChainMsg() {
    return {
        'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
    };
};

var responseLatestMsg = function responseLatestMsg() {
    return {
        'type': MessageType.RESPONSE_BLOCKCHAIN,
        'data': JSON.stringify([helper.getLatestBlock()])
    };
};

var broadcast = function broadcast(message) {
    return sockets.forEach(function (socket) {
        return write(socket, message);
    });
};

exports.connectToPeers = function (newPeers) {
    newPeers.forEach(function (peer) {
        var ws = new WebSocket(peer);
        ws.on('open', function () {
            return initConnection(ws);
        });
        ws.on('error', function () {
            console.log('Connection failed');
        });
    });
};

exports.initP2PServer = function (p2p_port) {
    var server = new WebSocket.Server({ port: p2p_port });
    server.on('connection', function (ws) {
        return initConnection(ws);
    });
    console.log('listening websocket p2p port on: ' + p2p_port);
};

var initConnection = function initConnection(ws) {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = function initMessageHandler(ws) {
    ws.on('message', function (data) {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var handleBlockchainResponse = function handleBlockchainResponse(message) {
    var receivedBlocks = JSON.parse(message.data).sort(function (b1, b2) {
        return b1.index - b2.index;
    });
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHeld = helper.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain");
            blockchain.push(latestBlockReceived);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

var initErrorHandler = function initErrorHandler(ws) {
    var closeConnection = function closeConnection(ws) {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', function () {
        return closeConnection(ws);
    });
    ws.on('error', function () {
        return closeConnection(ws);
    });
};