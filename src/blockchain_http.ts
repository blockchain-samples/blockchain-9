import { Helper } from './helper';
import { Constants } from './constants';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as WebSocket from 'ws';

export class BlockChainHttp {
    private helper: Helper;
    private constants: Constants;
    sockets = [];

    constructor() {
        this.helper = new Helper();
        this.constants = new Constants();

        
    }

    private queryChainLengthMsg = () => ({'type': this.constants.QUERY_LATEST});
    
    public initHttpServer = (http_port) => {
        const app = express();
        app.use(bodyParser.json());
    
        app.get('/blocks', (req, res) => res.send(JSON.stringify(this.helper.blockchain)));
        app.post('/mineBlock', (req, res) => {
            const newBlock = this.helper.generateNextBlock(req.body.data);
            this.helper.addBlock(newBlock);
            this.broadcast(this.responseLatestMsg());
            console.log('Block added ' + JSON.stringify(newBlock));
            res.send();
        });
    
        app.get('/pears', (req, res) => {
            res.send(this.sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
        });
    
        app.post('/addPear', (req, res) => {
            this.connectToPeers([req.body.peer]);
            res.send();
        });
    
        app.listen(http_port, () => {
            console.log('Listening http on port ' + http_port);
        });
    };
    
    private responseChainMsg = () =>({
        'type': this.constants.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(this.helper.blockchain)
    });
    
    private responseLatestMsg = () => ({
        'type': this.constants.RESPONSE_BLOCKCHAIN,
        'data': JSON.stringify([this.helper.getLatestBlock()])
    });
    
    private broadcast = (message) => this.sockets.forEach(socket => this.write(socket, message));
    
    public connectToPeers = (newPeers) => {
        newPeers.forEach((peer) => {
            const ws = new WebSocket(peer);
            ws.on('open', () => this.initConnection(ws));
            ws.on('error', () => {
                console.log('Connection failed')
            });
        });
    };
    
    public initP2PServer = (p2p_port) => {
        const server = new WebSocket.Server({port: p2p_port});
        server.on('connection', ws => this.initConnection(ws));
        console.log('listening websocket p2p port on: ' + p2p_port);
    };
    
    private initConnection = (ws) => {
        this.sockets.push(ws);
        this.initMessageHandler(ws);
        this.initErrorHandler(ws);
        this.write(ws, this.queryChainLengthMsg());
    };
    
    private initMessageHandler = (ws) => {
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            console.log('Received message' + JSON.stringify(message));
            switch (message.type) {
                case this.constants.QUERY_LATEST:
                    this.write(ws, this.responseLatestMsg());
                    break;
                case this.constants.QUERY_ALL:
                    this.write(ws, this.responseChainMsg());
                    break;
                case this.constants.RESPONSE_BLOCKCHAIN:
                    this.handleBlockchainResponse(message);
                    break;
            }
        });
    };

    private write = (ws, message) => ws.send(JSON.stringify(message));
    
    private handleBlockchainResponse = (message) => {
        const receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.helper.getLatestBlock();
        if (latestBlockReceived.index > latestBlockHeld.index) {
            console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
            if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
                console.log("We can append the received block to our chain");
                this.helper.blockchain.push(latestBlockReceived);
                this.broadcast(this.responseLatestMsg());
            } else if (receivedBlocks.length === 1) {
                console.log("We have to query the chain from our peer");
                this.broadcast(this.queryAllMsg());
            } else {
                console.log("Received blockchain is longer than current blockchain");
                this.replaceChain(receivedBlocks);
            }
        } else {
            console.log('received blockchain is not longer than received blockchain. Do nothing');
        }
    };

    private queryAllMsg = () => ({'type': this.constants.QUERY_ALL});
    
    private initErrorHandler = (ws) => {
        const closeConnection = (ws) => {
            console.log('connection failed to peer: ' + ws.url);
            this.sockets.splice(this.sockets.indexOf(ws), 1);
        };
        ws.on('close', () => closeConnection(ws));
        ws.on('error', () => closeConnection(ws));
    };

    private replaceChain = (newBlocks) => {
		if (this.helper.isValidChain(newBlocks) && newBlocks.length > this.helper.blockchain.length) {
			console.log('Received blockain is valid. Replacing current blockain with received blockchain');
			this.helper.blockchain = newBlocks;
			this.broadcast(this.responseLatestMsg());
		} else {
			console.log('Received blockchain invalid');
		}
	};
}