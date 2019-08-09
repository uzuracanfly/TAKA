const HASHS = new (require('./hashs.js')).hashs();
const HAX = require('./hex.js');
let SPHINCS = require("supersphincs");
const SR = require('secure-random');
const MAIN = require('./main.js');

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
	};

	async CreatePrivkey(){
		const KEYPAIR = await SPHINCS.keyPair();
		let keys = await SPHINCS.exportKeys(KEYPAIR);
		let privkey = keys.private.superSphincs;

		privkey = new HAX.HexText().string_to_utf8_hex_string(privkey);

		return privkey;
	};


	async GetPrivkeyToPubkey(privkey){
		privkey = new HAX.HexText().utf8_hex_string_to_string(privkey);
		const KEYPAIR = await SPHINCS.importKeys(
			{
				private: {
					superSphincs: privkey
				}
			}
		);
		let keys = await SPHINCS.exportKeys(KEYPAIR);
		let pubkey = keys.public.superSphincs;

		pubkey = new HAX.HexText().string_to_utf8_hex_string(pubkey);

		return pubkey;
	};


	async GetSignData(privkey,data){
		privkey = new HAX.HexText().utf8_hex_string_to_string(privkey);
		const KEYPAIR = await SPHINCS.importKeys(
			{
				private: {
					superSphincs: privkey
				}
			}
		);
		data = Uint8Array.from(Buffer.from(data, "hex"));

		let sig = await SPHINCS.signDetached(data, KEYPAIR.privateKey);

		sig = Buffer.from(sig).toString("hex");

		return sig;
	};


	async ConfirmationSign(data,sig,pubkey){
		data = Uint8Array.from(Buffer.from(data, "hex"));
		sig = Uint8Array.from(Buffer.from(sig, "hex"));
		pubkey = new HAX.HexText().utf8_hex_string_to_string(pubkey);

		const KEYPAIR = await SPHINCS.importKeys(
			{
				public: {
					rsa: pubkey.slice(0,600),
					sphincs: pubkey.slice(600),
					superSphincs: pubkey
				}
			}
		);

		let bool = await SPHINCS.verifyDetached(sig, data, KEYPAIR.publicKey);
		return bool;
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