import Block from './block';
import * as CryptoJS from "crypto-js";

export class Helper {
	public blockchain: Block[];

	constructor() {
		this.blockchain = [this.getGenesisBlock()];
	};

	public getLatestBlock = () => this.blockchain[this.blockchain.length - 1];

	public generateNextBlock = (blockData) => {
		const previousBlock = this.getLatestBlock();
		const nextIndex = previousBlock.index + 1;
		const nextTimestamp = new Date().getTime() / 1000;
		const nextHash = this.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
		return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
	};
	
	public addBlock = (newBlock) => {
		if (this.isValidNewBlock(newBlock, this.getLatestBlock())) {
			this.blockchain.push(newBlock);
		}
	};

	private getGenesisBlock = () => {
		return new Block(0, "0", 1465154705, "my genesis block", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
	};
	
	private calculateHash = (index, previousHash, timestamp, data) => {
		return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
	};
	
	private isValidNewBlock = (newBlock, previousBlock) => {
		if (previousBlock.index + 1 !== newBlock.index) {
			console.log('Invalid index');
			return false;
		} else if (previousBlock.hash !== newBlock.previousBlock) {
			console.log('invalid previousHash');
			return false;
		} else if (this.calculateHashForBlock(newBlock) !== newBlock.hash) {
			console.log('invalid hash ' + this.calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
			return false;
		}
		return true;
	};
	
	private calculateHashForBlock = (block) => {
		return this.calculateHash(block.index, block.previousHash, block.timestamp, block.data);
	};
}