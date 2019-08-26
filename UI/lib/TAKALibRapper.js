global.TAKA = {
	"TRANSACTION":require('../../transaction.js'),
	"ACCOUNT":require('../../account.js'),
	"CRYPTO":require('../../crypto.js'),
	"TRANSACTIONTOOLS_TAGREWARD":require('../../TransactionTools/tagreward'),
	"TRANSACTIONTOOLS_DATABASE":require('../../TransactionTools/database.js'),
	"TRANSACTIONTOOLS_TAGORDER":require('../../TransactionTools/tagorder.js'),
	"TRANSACTIONTOOLS_TAGADDPERMIT":require('../../TransactionTools/tagaddpermit.js'),
	"TRANSACTIONTOOLS_CONTRACT":require('../../TransactionTools/contract.js'),
	"HASHS":require('../../hashs.js'),
	"API":class{
		constructor (apiurl){
			this.apiurl = apiurl;
		};

		post(args){
			args = (JSON.stringify(args)).replace( /@/g , "" );

			let jresult = $.ajax({
				url: this.apiurl,
				type:'POST',
				data: args,
				contentType: 'application/json',
				dataType: "json",
				timeout:1000*10,
				async: false,
			}).responseText;

			//console.log(jresult);

			return JSON.parse( jresult );
		};


		PostAsync(args,callback,CallbackArgs){

			args = (JSON.stringify(args)).replace( /@/g , "" );

			let ret = $.ajax({
				url: this.apiurl,
				type:'POST',
				data: args,
				contentType: 'application/json',
				dataType: "json",
				timeout:1000*60*10,
				async: true,
				success: function(CallbackResult){
					callback(CallbackResult,CallbackArgs);
				}
			});

			return ret;
		};


		getaccount(key,LessIndex=0,callback="",CallbackArgs=""){
			let args = {
				"function":"getaccount",
				"args":{
					"key":key,
					"LessIndex":LessIndex,
				}
			};

			let result;
			if (!callback){
				result = this.post(args);
			}else{
				result = this.PostAsync(args,callback,CallbackArgs);
			};
			return result;
		};


		gettag(tag){
			let args = {
				"function":"gettag",
				"args":{
					"tag":tag,
				}
			};

			let result = this.post(args);
			return result;
		};

		sendtx(rawtx,callback="",CallbackArgs=""){
			let args = {
				"function":"sendtx",
				"args":{
					"rawtx":rawtx
				}
			};

			let result;
			if (!callback){
				result = this.post(args);
			}else{
				result = this.PostAsync(args,callback,CallbackArgs);
			};
			return result;
		}

		getrawtx(txid){
			let args = {
				"function":"getrawtx",
				"args":{
					"txid":txid
				}
			};

			let result = this.post(args);
			return result;
		}

		gettx(txid){
			let args = {
				"function":"gettx",
				"args":{
					"txid":txid,
				}
			};

			let result = this.post(args);
			return result;
		}

		CallRunContractTransaction(address,tag,FunctionName,FunctionArgs){
			let args = {
				"function":"callruncontracttransaction",
				"args":{
					"address":address,
					"tag":tag,
					"FunctionName":FunctionName,
					"FunctionArgs":FunctionArgs,
				}
			};

			let result = this.post(args);
			return result;
		}


		RunCode(address,tag,FunctionName,FunctionArgs){
			let args = {
				"function":"runcode",
				"args":{
					"address":address,
					"tag":tag,
					"FunctionName":FunctionName,
					"FunctionArgs":FunctionArgs,
				}
			};

			let result = this.post(args);
			return result;
		};


		exchange(type,PayTxid,ReceiverAddress,amount){
			let args = {
				"function":"exchange",
				"args":{
					"type":type,
					"PayTxid":PayTxid,
					"ReceiverAddress":ReceiverAddress,
					"amount":amount,
				}
			};

			let result = this.post(args);
			return result;
		};
	},
	"RappingFunctions":class{
		constructor (apiurl){
			this.TAKAAPI = new TAKA.API(apiurl);
		};

		async SendTransaction (privkey,type,tag,toaddress,amount,data){
			let outthis = this;
			return new Promise(async function (resolve, reject) {

				let keys = await (new TAKA.ACCOUNT.account(privkey)).GetKeys();

				let AccountData = outthis.TAKAAPI.getaccount(keys["address"],0);
				let MerkleRoot = "";
				let txs = [];
				if (tag in AccountData["txids"]){
					MerkleRoot = AccountData["txids"][tag]["MerkleRoot"];
					txs = AccountData["txids"][tag]["txs"];
				}
				let index = txs.length;
				let time = Math.floor(Date.now()/1000);

				let objtx = {
					"pubkey":keys["pubkey"],
					"type":type,
					"time":time,
					"tag":tag,
					"index":index+1,
					"MerkleRoot":MerkleRoot,
					"toaddress":toaddress,
					"amount":parseInt(amount),
					"data":data,
					"sig":"",
					"nonce":0,
				};
				//console.log(objtx);
				let TargetTransaction = new TAKA.TRANSACTION.Transaction("",privkey,objtx);



				/* Targetの取得 */
				let target = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

				//最後のトランザクションの時間を取得
				let lasttxid = txs.slice(-1)[0];
				let LASTTX  = TAKA.TRANSACTION.GetTx(lasttxid);
				let lasttxtime = time - 60*10;
				if (LASTTX){
					lasttxtime = (await LASTTX.GetObjTx())["time"];
				}

				if (tag != "pay" && tag != "tagreward"){
					let objfirsttx = outthis.TAKAAPI.gettx(txs[0]);

					let FIRSTTXDATA = new TAKA.TRANSACTIONTOOLS_TAGORDER.TagOrderData(objfirsttx["data"]);
					let objdata = FIRSTTXDATA.GetObjData();

					target = await TargetTransaction.GetPOWTarget(await TargetTransaction.GetRawTx(),objdata["powtarget"],lasttxtime);
				}else{
					target = await TargetTransaction.GetPOWTarget(await TargetTransaction.GetRawTx(),null,lasttxtime);
				}



				let result = TargetTransaction.GetNonce(await TargetTransaction.GetRawTx(),target);
				let objsendtx = await TargetTransaction.GetObjTx();



				result.then(async function(nonce){

					objsendtx["nonce"] = nonce;

					TargetTransaction = new TAKA.TRANSACTION.Transaction("",privkey,objsendtx);
					let rawtx = await TargetTransaction.GetRawTx();


					outthis.TAKAAPI.sendtx(
						rawtx,
						function(CallbackResult,CallbackArgs){
							return resolve({"txid":CallbackResult,"rawtx":rawtx});
						}
					);
				});
			});
		}
	}
}