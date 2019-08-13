const WEB3 = require('web3');
const WEB3d = new WEB3("wss://mainnet.infura.io/ws/v3/79f3dbc85c2e4ffdbd526aacd6934979");
const ETHTX = require('ethereumjs-tx');
const SR = require('secure-random');
const REQUEST = require('request');

const MAIN = require('./main.js');
const CONFIG = require('./config.js');
const HEX = require('./hex.js');




class APIRapper_etherscan{
	constructor(baseurl,apikey){
		this.baseurl = baseurl;
		this.apikey = apikey;
	};


	async postcross(url,args){
		return new Promise(function (resolve, reject) {
			//オプションを定義
			let options = {
				url: url,
				method: 'POST',
				form: args
			}

			//リクエスト送信
			REQUEST(options, function (error, response, body) {
				return resolve(JSON.parse(body));
			});
		});
	};


	async GetBalance(address){
		let args = {
			"module":"account",
			"action":"balance",
			"address":address,
			"tag":"latest",
			"apikey":this.apikey,
		}

		let result = await this.postcross(this.baseurl,args);

		return result;
	};



	async GetCall(address,data){
		let args = {
			"module":"proxy",
			"action":"eth_call",
			"to":address,
			"data":data,
			"tag":"latest",
			"apikey":this.apikey,
		}

		let result = await this.postcross(this.baseurl,args);

		return result;
	};



	async SendTransaction(hex){
		let args = {
			"module":"proxy",
			"action":"eth_sendRawTransaction",
			"hex":hex,
			"apikey":this.apikey,
		}

		let result = await this.postcross(this.baseurl,args);

		return result;
	};



	async GetTransactionCount(address){
		let args = {
			"module":"proxy",
			"action":"eth_getTransactionCount",
			"address":address,
			"tag":"latest",
			"apikey":this.apikey,
		}

		let result = await this.postcross(this.baseurl,args);

		return result;
	};



	async GetGasPrice(){
		let args = {
			"module":"proxy",
			"action":"eth_gasPrice",
			"apikey":this.apikey,
		}

		let result = await this.postcross(this.baseurl,args);

		return result;
	};


	async GetTransactionData(txid){
		let args = {
			"module":"proxy",
			"action":"eth_getTransactionReceipt",
			"txhash":txid,
			"apikey":this.apikey,
		}

		let result = await this.postcross(this.baseurl,args);

		return result;
	};

};





exports.ETHCoind = class{
	constructor(key="",ContractAddress="",fee=parseInt(0.001*(10**18))){
		this.key = key;
		this.ContractAddress = ContractAddress;
		this.fee = parseInt(fee);
		this.setupbool = false;
		this.api = new APIRapper_etherscan(CONFIG.API.exchange.EtherscanAPI["URL"],CONFIG.API.exchange.EtherscanAPI["APIKEY"]);
	};


	async SetUpClass(){
		if (this.setupbool){
			return 0;
		}
		this.setupbool = true;

		if (!this.key){
			this.key = SR.randomBuffer(32);
		};

		return 1;
	}

	async DoubleDigit(hex){
		if (hex.length%2 == 1){
			hex = "0" + hex;
		};

		return hex;
	};


	async FormKey(hex,Modifier){
		hex = hex.replace( "0x", "" );
		if (Modifier){
			hex = "0x" + hex;
		};

		return hex;
	};


	async paddingZero(hex, digit){
		let NeedDigit = digit - hex.length;

		for (let index=0;index<NeedDigit;index++){
			hex = "0" + hex;
		};

		return hex;
	};

	async CreateData(method,args){
		let LastTextdata = "";
		let result = method;
		for (let index in args){
			let arg = args[index];

			if (arg["type"] == "uint8" || arg["type"] == "uint256"){
				let value = arg["value"];
				value = parseInt(value).toString(16);
				result = result + await this.paddingZero(value, 64);
			}else if(arg["type"] == "address"){
				let value = arg["value"];
				value = await this.FormKey(value,false);
				result = result + await this.paddingZero(value, 64);
			}else if(arg["type"] == "string"){
				let text = arg["value"];
				let textlen = text.length;
				textlen = parseInt(textlen).toString(16);
				textlen = await this.paddingZero(textlen, 64);
				text = new HEX.HexText().string_to_utf8_hex_string(text);
				text = await this.paddingZero(text, 64);

				let startindex = result.length/2 + LastTextdata.length/2;
				startindex = parseInt(startindex).toString(16);
				startindex = await this.paddingZero(startindex, 64);
				result = result + startindex;

				LastTextdata = textlen + text;
			}else if(arg["type"] == "data"){
				let value = arg["value"];
				result = result + value;
			};
		}

		return result + LastTextdata;
	};






	async GetKeys(key=this.key){
		await this.SetUpClass();
		if (!key){
			key = this.key;
		}

		key = await this.FormKey(key,true);

		/* キーの識別 */
		let address = "";
		let privkey = "";
		if (key.length == 42){
			address = key;
		}else if(key.length == 66){
			privkey = key;
		};

		if (privkey){
			let result = WEB3d.eth.accounts.privateKeyToAccount(privkey);
			address = await this.FormKey(result["address"],true);
		};

		let keys = {
			"privkey":privkey,
			"address":address,
		}

		return keys;
	};


	async GetBalanceCoin(key=this.key){
		await this.SetUpClass();
		if (!key){
			key = this.key;
		}

		let keys = await this.GetKeys(key);
		let balance = (await this.api.GetBalance(keys["address"]))["result"];
		balance = parseInt(balance);

		return balance
	};


	async GetBalanceToken(key=this.key){
		await this.SetUpClass();
		if (!key){
			key = this.key;
		}

		let keys = await this.GetKeys();

		let args = [
			{"type":"address","value":keys["address"]},
		];
		let data = await this.CreateData("0x70a08231",args);

		let balance = (await this.api.GetCall(this.ContractAddress,data))["result"];
		if (balance == "0x"){
			return parseInt(0);
		}else{
			return parseInt(balance);
		};
	};

	async SendCoin(toaddress,amount,key=this.key){
		await this.SetUpClass();
		if (!key){
			key = this.key;
		}

		amount = parseInt(amount);

		let keys = await this.GetKeys();

		amount = amount.toString(16);
		amount = await this.DoubleDigit(amount);

		let nonce = parseInt((await this.api.GetTransactionCount(keys["address"]))["result"],16);
		nonce = nonce.toString(16);
		nonce = await this.DoubleDigit(nonce);

		let gasLimit = 21000;
		let gasPrice = parseInt(this.fee / gasLimit).toString(16);
		gasPrice = await this.DoubleDigit(gasPrice);
		gasLimit = gasLimit.toString(16);
		gasLimit = await this.DoubleDigit(gasLimit);





		let objtx = {
			nonce: '0x'+nonce,
			chainId: 1,
			gasPrice: '0x'+gasPrice,
			gasLimit: '0x'+gasLimit,
			to: toaddress,
			value: '0x'+amount,
			data: null
		};
		let privkey = await this.FormKey(keys["privkey"],false);
		privkey = Buffer.from(privkey, 'hex');

		const tx = new ETHTX(objtx);
		tx.sign(privkey);
		const serializedTx = tx.serialize();
		const signtx = serializedTx.toString('hex');

		let result = await this.api.SendTransaction('0x'+signtx);

		return result["result"];
	};


	async SendToken(toaddress,amount,key=this.key){
		await this.SetUpClass();
		if (!key){
			key = this.key;
		}


		amount = parseInt(amount);

		let keys = await this.GetKeys();

		let nonce = parseInt((await this.api.GetTransactionCount(keys["address"]))["result"],16);
		nonce = nonce.toString(16);
		nonce = await this.DoubleDigit(nonce);

		let gasLimit = 60000;
		let gasPrice = parseInt(this.fee / gasLimit).toString(16);
		gasPrice = await this.DoubleDigit(gasPrice);
		gasLimit = gasLimit.toString(16);
		gasLimit = await this.DoubleDigit(gasLimit);



		let args = [
			{"type":"address","value":toaddress},
			{"type":"uint256","value":amount},
		];
		let data = await this.CreateData("0xa9059cbb",args);



		let objtx = {
			nonce: '0x'+nonce,
			chainId: 1,
			gasPrice: '0x'+gasPrice,
			gasLimit: '0x'+gasLimit,
			to: this.ContractAddress,
			value: '0x00',
			data: data
		};
		let privkey = await this.FormKey(keys["privkey"],false);
		privkey = Buffer.from(privkey, 'hex');

		let tx = new ETHTX(objtx);
		tx.sign(privkey);
		const serializedTx = tx.serialize();
		const signtx = serializedTx.toString('hex');

		let result = await this.api.SendTransaction('0x'+signtx);

		return result["result"];
	};



	async GetTransactionData(txid){
		let result = await this.api.GetTransactionData(txid);

		return result["result"];
	}
};