'use strict';

var blockchainHttp = require("./blockchain_http.js");

var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

console.log('Starting blockchain app');

var queryAllMsg = function queryAllMsg() {
  return { 'type': MessageType.QUERY_ALL };
};

var write = function write(ws, message) {
  return ws.send(JSON.stringify(message));
};

blockchainHttp.connectToPeers(initialPeers);
blockchainHttp.initHttpServer(http_port);
blockchainHttp.initP2PServer(p2p_port);