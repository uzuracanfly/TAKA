const RIPEMD160 = require('ripemd160');
const SHA256 = require('js-sha256').sha256;
const SHA512 = require('js-sha512').sha512;

exports.hashs = class{
	constructor (){};


	sha256d(hex)
	{
		hex = Buffer.from(hex, 'hex');
		let hash = SHA256.hex(hex);
		hash = Buffer.from(hash, 'hex');
		hash = SHA256.hex(hash);

		return hash;
	}

	sha256(hex)
	{
		hex = Buffer.from(hex, 'hex');
		let hash = SHA256.hex(hex);

		return hash;
	}

	sha512(hex)
	{
		hex = Buffer.from(hex, 'hex');
		let hash = SHA512.hex(hex);

		return hash;
	}

	ripemd160(hex)
	{
		hex = Buffer.from(hex, 'hex');
		return new RIPEMD160().update(hex).digest('hex')
	}


	GetMarkleroot(hashlist){
		if (hashlist.length == 0){
			return "";
		};
		if (hashlist.length == 1){
			return hashlist[0];
		};


		let resulthashlist = [];
		for (let index=0;index<hashlist.length-1;index=index+2){
			let hash = this.GetHash2(hashlist[index],hashlist[index+1]);
			resulthashlist.push(hash);
		};
		if (hashlist.length%2 == 1){
			let resthashlist = hashlist.slice(-1);
			let hash = this.GetHash2(resthashlist[0],resthashlist[0]);
			resulthashlist.push(hash);
		};


		return this.GetMarkleroot(resulthashlist);
	}



	GetHash2(hashA,hashB){
		let sumhash = hashA + hashB;

		sumhash = this.sha256d(sumhash);

		return sumhash;
	};
};