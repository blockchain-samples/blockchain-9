"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Block = function Block(index, previousHash, timestamp, data, hash) {
	_classCallCheck(this, Block);

	this.index = index;
	this.previousHash = previousHash.toString();
	this.timestamp = timestamp;
	this.data = data;
	this.hash = hash;
};

exports.default = Block;