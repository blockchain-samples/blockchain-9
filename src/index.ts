
import { BlockChainHttp } from './blockchain_http';

const blockchainHttp = new BlockChainHttp();
const http_port = process.env.HTTP_PORT || 3001;
const p2p_port = process.env.P2P_PORT || 6001;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

console.log('Starting blockchain app');

blockchainHttp.connectToPeers(initialPeers);
blockchainHttp.initHttpServer(http_port);
blockchainHttp.initP2PServer(p2p_port);