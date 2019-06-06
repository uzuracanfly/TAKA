const HASHS = new (require('./hashs.js')).hashs();
const SR = require('secure-random');
const ECDSA = require('secp256k1');
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
		this.ChildPrivkeyPara = {
			"UnitSize":4,
			"WordSize":16,
			"LengthSize":16,
		}

		this.PubkeyPara = {
			"UnitSize":8,
			"WordSize":this.ChildPrivkeyPara["WordSize"],
			"LengthSize":this.ChildPrivkeyPara["LengthSize"],
		}
	};


	CreatePrivkey(){
		let privkey = SR.randomBuffer(32);

		return privkey.toString('hex');
	};


	//秘密鍵を拡張
	GetChildPrivkey(privkey){
		let ChildPrivkey = "";

		let needsize = this.ChildPrivkeyPara["UnitSize"] * this.ChildPrivkeyPara["WordSize"] * this.ChildPrivkeyPara["LengthSize"];
		let loopcount = needsize / 128;
		let orgsize = 64 / loopcount;

		for (let index=0;index<loopcount;index++){
			let seed = privkey.slice(index*orgsize,index*orgsize+orgsize);
			let seedhash = HASHS.sha512(seed);

			ChildPrivkey = ChildPrivkey + seedhash;
		};

		return ChildPrivkey;
	};

	//キーを乱数対のための配列に変換
	GetObjkeyLine(key,splitnum=4,linenum=16,wordnum=16){
		let keyLineObj = [];

		for (let index=0;index<wordnum;index++){
			let keyLineObjColoum = [];
			for (let mindex=0;mindex<linenum;mindex++){
				let seed = key.slice((splitnum*mindex)+((splitnum*linenum)*index),(splitnum*mindex)+((splitnum*linenum)*index)+splitnum);
				keyLineObjColoum.push(seed);
			}
			keyLineObj.push(keyLineObjColoum);
		}

		return keyLineObj;
	}


	GetSmartPubkeySeed(privkeyseed){
		let pubkeyseed = HASHS.yescrypt(privkeyseed);
		pubkeyseed = pubkeyseed.slice(0,this.PubkeyPara["UnitSize"]);

		return pubkeyseed;
	}



	GetObjKeys(key){

		function cut(len){
			let cuthex = key.slice(0,len);
			key = key.slice(len);
			return cuthex
		};

		function VariableCut(lenlen=16){
			let len = parseInt(cut(lenlen),16);

			let cuthex = key.slice(0,len);
			key = key.slice(len);

			return cuthex
		};


		let KeyToLamPort = VariableCut(4);
		let KeyToEcdsa = VariableCut(4);

		return {"LamPort":KeyToLamPort,"Ecdsa":KeyToEcdsa};
	}



	GetPrivkeyToPubkey(privkey){
		let ChildPrivkey = this.GetChildPrivkey(privkey);
		let ObjChildPrivkey = this.GetObjkeyLine(ChildPrivkey,this.ChildPrivkeyPara["UnitSize"],this.ChildPrivkeyPara["WordSize"],this.ChildPrivkeyPara["LengthSize"]);

		//ランポート署名の鍵
		let PubkeyToLamPort = "";
		for (let index=0;index<(ObjChildPrivkey.length*(ObjChildPrivkey[0]).length);index++){
			let privkeyseed = ChildPrivkey.slice(index*this.ChildPrivkeyPara["UnitSize"],index*this.ChildPrivkeyPara["UnitSize"]+this.ChildPrivkeyPara["UnitSize"]);
			//4桁
			let pubkeyseed = this.GetSmartPubkeySeed(privkeyseed);

			PubkeyToLamPort = PubkeyToLamPort + pubkeyseed;
		};
		let PubkeyToLamPortLen = MAIN.GetFillZero((PubkeyToLamPort.length).toString(16), 4);


		//ecdsa署名の鍵
		let PubkeyToEcdsa = ECDSA.publicKeyCreate( Buffer.from(privkey, 'hex') );
		PubkeyToEcdsa = PubkeyToEcdsa.toString('hex');
		let PubkeyToEcdsaLen = MAIN.GetFillZero((PubkeyToEcdsa.length).toString(16), 4);


		let pubkey = PubkeyToLamPortLen + PubkeyToLamPort + PubkeyToEcdsaLen + PubkeyToEcdsa;

		return pubkey;
	};


	GetSignData(privkey,data){
		let ChildPrivkey = this.GetChildPrivkey(privkey);
		let ObjChildPrivkey = this.GetObjkeyLine(ChildPrivkey,this.ChildPrivkeyPara["UnitSize"],this.ChildPrivkeyPara["WordSize"],this.ChildPrivkeyPara["LengthSize"]);



		let ObjSigToEcdsa = ECDSA.sign(Buffer.from(data, 'hex'), Buffer.from(privkey, 'hex'));
		let SigToEcdsa = ECDSA.signatureExport(ObjSigToEcdsa.signature);
		SigToEcdsa = SigToEcdsa.toString('hex');



		let SigToLamPort = "";
		for (let index=0;index<SigToEcdsa.length;index++){
			let numberd = parseInt(SigToEcdsa[index],16);

			let usingindex = index;
			if (ObjChildPrivkey.length-1<index){
				usingindex = index%(ObjChildPrivkey.length-1);
			}

			SigToLamPort = SigToLamPort + ObjChildPrivkey[usingindex][numberd];
		}



		return SigToLamPort;
	};


	ConfirmationSign(data,sig,pubkey){
		let ObjPubkeys = this.GetObjKeys(pubkey);

		let PubkeyToLamPort = ObjPubkeys["LamPort"];
		let ObjPubkeyToLamPort = this.GetObjkeyLine(PubkeyToLamPort,this.PubkeyPara["UnitSize"],this.PubkeyPara["WordSize"],this.PubkeyPara["LengthSize"]);

		//原文を求める
		let needscan = sig.length / this.ChildPrivkeyPara["UnitSize"];
		let AnswerOrg = "";
		for (let index=0;index<needscan;index++){
			let SigSeed = sig.slice(index*this.ChildPrivkeyPara["UnitSize"],index*this.ChildPrivkeyPara["UnitSize"]+this.ChildPrivkeyPara["UnitSize"]);
			let SigSeedHash = this.GetSmartPubkeySeed(SigSeed);

			let usingindex = index;
			if (ObjPubkeyToLamPort.length-1<index){
				usingindex = index%(ObjPubkeyToLamPort.length-1);
			}

			for (let mindex=0;mindex<ObjPubkeyToLamPort[usingindex].length;mindex++){
				let PubkeyToLamPortSeed = ObjPubkeyToLamPort[usingindex][mindex];

				if (SigSeedHash == PubkeyToLamPortSeed){
					AnswerOrg = AnswerOrg + mindex.toString(16);
					break;
				};
			};
		};




		let SigToEcdsa = AnswerOrg;
		SigToEcdsa = ECDSA.signatureImport(Buffer.from(SigToEcdsa, 'hex'));
		let PubkeyToEcdsa = ObjPubkeys["Ecdsa"];
		PubkeyToEcdsa = Buffer.from(PubkeyToEcdsa, 'hex')


		let bool = ECDSA.verify(Buffer.from(data, 'hex'),SigToEcdsa,PubkeyToEcdsa);
		if (!bool){
			return false;
		}




		return true;
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