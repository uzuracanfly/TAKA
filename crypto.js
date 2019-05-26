/*

	電子署名

	let Sign = new crypto.signature();
	let privkey = Sign.CreatePrivkey();
	console.log(privkey);
	let pubkey = Sign.GetPrivkeyToPubkey(privkey);
	console.log(pubkey);
	let signdata = Sign.GetSignData(privkey,"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
	console.log(Sign.ConfirmationSign("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",signdata,pubkey));
*/

exports.signature = class{
	constructor (){
		this.ecdsa = require('secp256k1');
		this.sr = require('secure-random');
	};


	CreatePrivkey(){
		let privkey = this.sr.randomBuffer(32);

		return privkey.toString('hex');
	};


	GetPrivkeyToPubkey(privkey){
		privkey = Buffer.from(privkey, 'hex');
		let pubkey = this.ecdsa.publicKeyCreate(privkey);
		pubkey = pubkey.toString('hex');

		return pubkey;
	};


	GetSignData(privkey,data){
		privkey = Buffer.from(privkey, 'hex');
		data = Buffer.from(data, 'hex');
		let sigObj = this.ecdsa.sign(data, privkey);
		let sig = this.ecdsa.signatureExport(sigObj.signature);
		sig = sig.toString('hex');

		return sig;
	};


	ConfirmationSign(data,sig,pubkey){
		try {
			data = Buffer.from(data, 'hex');
			sig = Buffer.from(sig, 'hex');
			pubkey = Buffer.from(pubkey, 'hex');

			sig = this.ecdsa.signatureImport(sig);

			return this.ecdsa.verify(data,sig,pubkey);
		} catch (e) {
			return false;
		}
	};
}



/*

	共有鍵

	var crypto = require('./crypto.js');


	let Common = new crypto.common();
	let privkey = Common.CreateKey();
	console.log(privkey);
	let endata = Common.GetEncryptedData(privkey,"うずら");
	console.log(endata);
	let dedata = Common.GetDecryptedData(privkey,endata);
	console.log(dedata);
*/

exports.common = class{
	constructor (){
		this.aesjs = require('aes-js');
		this.sr = require('secure-random');
	};


	CreateKey(){
		let key = this.sr.randomBuffer(32);

		return key.toString('hex');
	};


	GetEncryptedData(key,data){
		key = Buffer.from(key, 'hex');
		data = this.aesjs.utils.utf8.toBytes(data);

		let aesCtr = new this.aesjs.ModeOfOperation.ctr(key, new this.aesjs.Counter(5));
		data = aesCtr.encrypt(data);

		return this.aesjs.utils.hex.fromBytes(data);
	};


	GetDecryptedData(key,data){
		key = Buffer.from(key, 'hex');
		data = this.aesjs.utils.hex.toBytes(data);

		let aesCtr = new this.aesjs.ModeOfOperation.ctr(key, new this.aesjs.Counter(5));
		data = aesCtr.decrypt(data);

		return this.aesjs.utils.utf8.fromBytes(data);
	};
};