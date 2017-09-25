'use strict';
const blockchainHttp = require("./blockchain_http.js");

const http_port = process.env.HTTP_PORT || 3001;
const p2p_port = process.env.P2P_PORT || 6001;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

console.log('Starting blockchain app');

const queryAllMsg = () => ({'type': MessageType.QUERY_ALL});

const write = (ws, message) => ws.send(JSON.stringify(message));

blockchainHttp.connectToPeers(initialPeers);
blockchainHttp.initHttpServer(http_port);
blockchainHttp.initP2PServer(p2p_port);