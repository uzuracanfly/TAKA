const FS = require('fs');
const URL = require('url');

const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const ACCOUNT = require('./account.js');
const TRANSACTION = require('./transaction.js');
const HASHS = require('./hashs.js');
const TRANSACTIONTOOLS_TAGREWARD = require('./TransactionTools/tagreward');
const TRANSACTIONTOOLS_DATABASE = require('./TransactionTools/database.js');
const TRANSACTIONTOOLS_TAGORDER = require('./TransactionTools/tagorder.js');
const TRANSACTIONTOOLS_TAGADDPERMIT = require('./TransactionTools/tagaddpermit.js');
const TRANSACTIONTOOLS_CONTRACT = require('./TransactionTools/contract.js');

const EXCHANGE = require('./exchange.js');
const ETHCOIND = require('./ETHCoind.js');


//API Server
exports.SetServer = function(){
	let http = require('http');

	http.createServer(async function(request,response) {
		try{
			(async () => {

				response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8','Access-Control-Allow-Origin': '*'});


				if(request.method === 'POST') {
					let ArgsData = "";
					request.on('data', function(chunk) {
						ArgsData += chunk;
					}).on('end', async function() {
						try{
							ArgsData = JSON.parse(ArgsData);

							RunAPIMethods(ArgsData,request,response);
						}catch(e){
							MAIN.note(2,"api_SetServer",e);
							response.write(JSON.stringify(false));
							response.end();
						}
					});
				}else{
					try{
						let ArgsData = URL.parse(request.url,true).query;
						let ParseArgsData = {};
						// 連想配列から取り出す
						for (let key in ArgsData) {
							try{
								ParseArgsData[key] = JSON.parse(ArgsData[key]);
							}catch(e){
								ParseArgsData[key] = ArgsData[key];
							}
						}

						RunAPIMethods(ParseArgsData,request,response);
					}catch(e){
						MAIN.note(2,"api_SetServer",e);
						response.write(JSON.stringify(false));
						response.end();
					}
				}
			})();
		}catch(e){
			MAIN.note(2,"api_SetServer",e);
			response.write(JSON.stringify(false));
			response.end();
		}
	}).listen(CONFIG.API["port"], CONFIG.API["address"]);
}















async function RunAPIMethods(ArgsData,request,response){
	try{

		if ((request.url).indexOf("/api") != -1){

			let ip = request.ip || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
			if (ip != '127.0.0.1'){
				if (("WhiteFunctionList" in CONFIG.API) && (CONFIG.API["WhiteFunctionList"].length > 0) && (CONFIG.API["WhiteFunctionList"]).indexOf(ArgsData["function"]) == -1){
					response.write(JSON.stringify(false));
					response.end();
					return false;
				}
				if ((CONFIG.API["BlackFunctionList"]).indexOf(ArgsData["function"]) > -1){
					response.write(JSON.stringify(false));
					response.end();
					return false;
				}
			};








			//curl http:/cation/json' -d '{"function":"getaccount","args":{"key":"5f2ba01ab3d8c3a418cf0232f83a0cd18e5a8a09"}}'
			if(ArgsData["function"] == "getaccount"){
				let key = "";
				if ("key" in ArgsData["args"] && ArgsData["args"]["key"]){
					key = ArgsData["args"]["key"];
				}

				let LessIndex = 0;
				if ("LessIndex" in ArgsData["args"] && ArgsData["args"]["LessIndex"]){
					LessIndex = ArgsData["args"]["LessIndex"];
				}

				let LessTime = 0;
				if ("LessTime" in ArgsData["args"] && ArgsData["args"]["LessTime"]){
					LessTime = ArgsData["args"]["LessTime"];
				}

				let BoolNeedApproved = 0;
				if ("BoolNeedApproved" in ArgsData["args"] && ArgsData["args"]["BoolNeedApproved"]){
					BoolNeedApproved = ArgsData["args"]["BoolNeedApproved"];
				}

				let TargetAccount = new ACCOUNT.account(key);
				let keys = await TargetAccount.GetKeys();


				let txids = {};
				let tags = await TRANSACTION.GetTags();
				for (let index in tags){
					let tag = tags[index];
					let tagtxs = await TargetAccount.GetFormTxList(undefined,tag,LessIndex,LessTime,BoolNeedApproved);
					let TagMerkleRoot = new HASHS.hashs().GetMarkleroot(tagtxs);

					txids[tag] = {
						"txs":tagtxs,
						"MerkleRoot":TagMerkleRoot,
					}
				}

				let callback = {
					"MinPrivkey":keys["MinPrivkey"],
					"privkey":keys["privkey"],
					"pubkey":keys["pubkey"],
					"address":keys["address"],
					"txids":txids,
					"balance":await TargetAccount.GetBalance(undefined,LessIndex,LessTime,BoolNeedApproved),
				}

				response.write(JSON.stringify(callback));
				response.end();
			};



			if (ArgsData["function"] == "getsendamounttoaddress"){
				let key = ArgsData["args"]["key"];
				let toaddress = ArgsData["args"]["toaddress"];

				let LessIndex = 0;
				if ("LessIndex" in ArgsData["args"] && ArgsData["args"]["LessIndex"]){
					LessIndex = ArgsData["args"]["LessIndex"];
				}

				let TargetAccount = new ACCOUNT.account(key);
				let callback = await TargetAccount.GetSendAmountToAddress(undefined,toaddress,LessIndex);

				response.write(JSON.stringify(callback));
				response.end();
			}




			if(ArgsData["function"] == "gettag"){
				let tag = ArgsData["args"]["tag"];

				if (!tag){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}

				let TagTxids = await TRANSACTION.GetTagTxids(tag);

				let callback = {
					"txids":TagTxids,
				}


				if (tag != "pay" && tag != "tagorder" && tag != "tagreward" && tag != "tagaddpermit"){
					let TAGORDERTX = await TRANSACTION.GetTagOrderTx(tag);
					if (TAGORDERTX){
						let TagOrderObjTx = await TAGORDERTX.GetObjTx();

						let TagOrderData = new TRANSACTIONTOOLS_TAGORDER.TagOrderData(TagOrderObjTx["data"]);
						let TagOrderObjData = TagOrderData.GetObjData();

						let ownerpubkey = TagOrderObjTx["pubkey"];
						let OwnerAccount = new ACCOUNT.account(ownerpubkey);

						let TagPermitAddresss = await TRANSACTION.GetTagPermitAddresss(tag);

						callback["owner"] = {
							"pubkey":ownerpubkey,
							"address":(await OwnerAccount.GetKeys())["address"]
						};
						callback["permissiontype"] = TagOrderObjData["permissiontype"];
						callback["powtarget"] = TagOrderObjData["powtarget"];
						callback["DataMaxSizeInByte"] = TagOrderObjData["DataMaxSizeInByte"];
						callback["FeeToAddress"] = TagOrderObjData["FeeToAddress"];
						callback["FeeAmount"] = TagOrderObjData["FeeAmount"];
						callback["TagPermitAddresss"] = TagPermitAddresss;
					}
				};

				response.write(JSON.stringify(callback));
				response.end();
			};



			if (ArgsData["function"] == "gettx"){
				let txid = ArgsData["args"]["txid"];


				if (!txid){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let TargetTransaction = await TRANSACTION.GetTx(txid);
				let rawtx = await TargetTransaction.GetRawTx();
				let objtx = await TargetTransaction.GetObjTx();

				let callback = {
					"rawtx":rawtx,
					"objtx":objtx,
				}

				response.write(JSON.stringify(callback));
				response.end();
			};










			/*
			サーバー管理関連コマンド
			*/
			if(ArgsData["function"] == "getimporttag"){
				let callback = await TRANSACTION.GetImportTags();

				response.write(JSON.stringify(callback));
				response.end();
			};
			if(ArgsData["function"] == "setimporttag"){
				let type = ArgsData["args"]["type"];
				let tag = ArgsData["args"]["tag"];

				let callback = await TRANSACTION.SetImportTags(type,tag);

				response.write(JSON.stringify(callback));
				response.end();
			};
			if(ArgsData["function"] == "getminingtags"){
				let callback = await TRANSACTIONTOOLS_TAGREWARD.GetMiningTags();

				response.write(JSON.stringify(callback));
				response.end();
			};
			if(ArgsData["function"] == "setminingtags"){
				let type = ArgsData["args"]["type"];
				let tag = ArgsData["args"]["tag"];

				let callback = await TRANSACTIONTOOLS_TAGREWARD.SetMiningTags(type,tag);

				response.write(JSON.stringify(callback));
				response.end();
			};












			if(ArgsData["function"] == "sendtx"){
				let rawtx = ArgsData["args"]["rawtx"];

				if (!rawtx){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}

				let TargetTransaction = new TRANSACTION.Transaction(rawtx);
				let result = await TargetTransaction.commit(undefined,true,true);


				response.write(JSON.stringify(result));
				response.end();

			};


















			if (ArgsData["function"] == "sendpaytx"){
				let key = ArgsData["args"]["key"];
				let toaddress = ArgsData["args"]["toaddress"];
				let amount = ArgsData["args"]["amount"];


				if (!key || !toaddress || !amount){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let result = TRANSACTION.SendPayTransaction(key,toaddress,amount);


				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			}



			if (ArgsData["function"] == "sendtagrewardtx"){
				let key = ArgsData["args"]["key"];
				let tag = ArgsData["args"]["tag"];
				let amount = ArgsData["args"]["amount"];


				if (!key || !tag || !amount){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let result = TRANSACTIONTOOLS_TAGREWARD.SendTagrewardTransaction(key,tag,amount);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			}




			if (ArgsData["function"] == "senddatabasetx"){
				let key = ArgsData["args"]["key"];
				let tag = ArgsData["args"]["tag"];
				let data = ArgsData["args"]["data"];

				let AddAddressIndex = "";
				if ("AddAddressIndex" in ArgsData["args"] && ArgsData["args"]["AddAddressIndex"]){
					AddAddressIndex = ArgsData["args"]["AddAddressIndex"];
				};

				let commonkey = "";
				if ("commonkey" in ArgsData["args"] && ArgsData["args"]["commonkey"]){
					commonkey = ArgsData["args"]["commonkey"];
				};


				if (!key || !tag || !data){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}



				let result = TRANSACTIONTOOLS_DATABASE.SendDatabaseTransaction(key,tag,data,AddAddressIndex,commonkey);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			}



			if (ArgsData["function"] == "sendtagordertx"){
				let key = ArgsData["args"]["key"];
				let tag = ArgsData["args"]["tag"];
				let permissiontype = ArgsData["args"]["permissiontype"];

				let powtarget = "0000000000000000000000000000000000000000000000000000000000000000";
				if ("powtarget" in ArgsData["args"] && ArgsData["args"]["powtarget"]){
					powtarget = ArgsData["args"]["powtarget"];
				}

				let DataMaxSizeInByte = 10000;
				if ("DataMaxSizeInByte" in ArgsData["args"] && ArgsData["args"]["DataMaxSizeInByte"]){
					DataMaxSizeInByte = ArgsData["args"]["DataMaxSizeInByte"];
				}

				let FeeToAddress = "";
				if ("FeeToAddress" in ArgsData["args"] && ArgsData["args"]["FeeToAddress"]){
					FeeToAddress = ArgsData["args"]["FeeToAddress"];
				};
				let FeeAmount = 0;
				if ("FeeAmount" in ArgsData["args"] && ArgsData["args"]["FeeAmount"]){
					FeeAmount = ArgsData["args"]["FeeAmount"];
				};

				if (!key || !tag || !permissiontype){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}

				let result = TRANSACTIONTOOLS_TAGORDER.SendTagOrderTransaction(key,tag,permissiontype,powtarget,DataMaxSizeInByte,FeeToAddress,FeeAmount);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			}



			if (ArgsData["function"] == "sendtagaddpermittx"){
				let key = ArgsData["args"]["key"];
				let tag = ArgsData["args"]["tag"];
				let addaddress = ArgsData["args"]["addaddress"];


				if (!key || !tag || !addaddress){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let result = TRANSACTIONTOOLS_TAGADDPERMIT.SendTagAddPermitTransaction(key,tag,addaddress);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			}



			if (ArgsData["function"] == "sendsetcontracttransaction"){
				let key = ArgsData["args"]["key"];
				let tag = ArgsData["args"]["tag"];
				let FunctionName = ArgsData["args"]["FunctionName"];
				let CodeType = ArgsData["args"]["CodeType"];
				let CodeData = ArgsData["args"]["CodeData"];
				let CodePath = "";
				if ("CodePath" in ArgsData["args"]){
					CodePath = ArgsData["args"]["CodePath"];
				};


				if (!key || !tag || !FunctionName || !CodeType || !CodeData){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let result = TRANSACTIONTOOLS_CONTRACT.SendSetContractTransaction(key,tag,FunctionName,CodeType,CodeData,CodePath);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			};



			if (ArgsData["function"] == "sendruncontracttransaction"){
				let key = ArgsData["args"]["key"];
				let tag = ArgsData["args"]["tag"];
				let FunctionName = ArgsData["args"]["FunctionName"];
				let FunctionArgs = ArgsData["args"]["FunctionArgs"];
				let AddAddressIndex = "";
				if ("AddAddressIndex" in ArgsData["args"]){
					AddAddressIndex = ArgsData["args"]["AddAddressIndex"];
				};


				if (!key || !tag || !FunctionName || !FunctionArgs){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let result = TRANSACTIONTOOLS_CONTRACT.SendRunContractTransaction(key,tag,FunctionName,FunctionArgs,AddAddressIndex);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			};



			if (ArgsData["function"] == "callruncontracttransaction"){
				let address = ArgsData["args"]["address"];
				let tag = ArgsData["args"]["tag"];
				let FunctionName = ArgsData["args"]["FunctionName"];
				let FunctionArgs = ArgsData["args"]["FunctionArgs"];
				let AddressIndexs = [];
				if ("AddressIndexs" in ArgsData["args"]){
					AddressIndexs = ArgsData["args"]["AddressIndexs"];
				};
				let lastonly = false;
				if ("lastonly" in ArgsData["args"]){
					lastonly = ArgsData["args"]["lastonly"];
				};


				if (!address || !tag || !FunctionName || !FunctionArgs){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let result = TRANSACTIONTOOLS_CONTRACT.CallRunContractTransaction(address,tag,FunctionName,FunctionArgs,AddressIndexs,lastonly);


				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});

			};



			if (ArgsData["function"] == "runcode"){
				let address = ArgsData["args"]["address"];
				let tag = ArgsData["args"]["tag"];
				let FunctionName = ArgsData["args"]["FunctionName"];
				let FunctionArgs = ArgsData["args"]["FunctionArgs"];
				let AddressIndexs = [];
				if ("AddressIndexs" in ArgsData["args"]){
					AddressIndexs = ArgsData["args"]["AddressIndexs"];
				};
				let lastonly = false;
				if ("lastonly" in ArgsData["args"]){
					lastonly = ArgsData["args"]["lastonly"];
				};


				if (!address || !tag || !FunctionName || !FunctionArgs){
					response.write(JSON.stringify(false));
					response.end();
					return 0;
				}


				let TargetAccount = new ACCOUNT.account(address);
				let result = TRANSACTIONTOOLS_CONTRACT.RunCode(TargetAccount,tag,FunctionName,FunctionArgs,AddressIndexs,lastonly);


				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});

			};
















			if (ArgsData["function"] == "exchange"){
				let type = ArgsData["args"]["type"];
				let PayTxid = ArgsData["args"]["PayTxid"];
				let ReceiverAddress = ArgsData["args"]["ReceiverAddress"];
				let amount = ArgsData["args"]["amount"];

				let result = EXCHANGE.SetExchangeOrder(type,PayTxid,ReceiverAddress,amount);

				result.then(function(value){
					response.write(JSON.stringify(value));
					response.end();
				});
			};
		};











		let HtmlLib = {
			"form":FS.readFileSync('UI/lib/MessagerLib/form.js'),
			"notification":FS.readFileSync('UI/lib/MessagerLib/notification.js'),
			"basicfunctions":FS.readFileSync('UI/lib/basicfunctions.js'),
			"TAKALibRapper":FS.readFileSync('UI/lib/TAKALibRapper_bundle.js'),
			"ETHCoindRapper":FS.readFileSync('UI/lib/ETHCoindRapper_bundle.js'),
			"TAKAICON":FS.readFileSync('UI/picture/TAKAICON.png'),
			"TAKAICON_NoBackground":FS.readFileSync('UI/picture/TAKAICON_NoBackground.png'),
			"twitter":FS.readFileSync('UI/picture/twitter.png'),
			"github":FS.readFileSync('UI/picture/github.png'),
			"wallet":FS.readFileSync('UI/picture/wallet.png'),
			"search":FS.readFileSync('UI/picture/search.png'),
			"Japan":FS.readFileSync('UI/picture/Japan.png'),
			"United-Kingdom":FS.readFileSync('UI/picture/United-Kingdom.png'),
			"GetNonceForWeb":FS.readFileSync('GetNonceForWeb_bundle.js'),
		};

		
		



		for (let libname in HtmlLib){
			if (request.url == "/lib/"+libname){
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.end(HtmlLib[libname]);
				break;
			};
		}


		if ((request.url).indexOf("/explorer") != -1){
			let ExplorerHtml = FS.readFileSync('UI/explorer.html');
			ExplorerHtml = ExplorerHtml.toString();
			ExplorerHtml = ExplorerHtml.replace( "MYURL", CONFIG.API["AccessPoint"] );
			ExplorerHtml = Buffer.from(ExplorerHtml, 'utf-8');
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.end(ExplorerHtml);
		};
		if ((request.url).indexOf("/wallet") != -1){
			let WalletHtml = FS.readFileSync('UI/wallet.html');
			WalletHtml = WalletHtml.toString();
			WalletHtml = WalletHtml.replace( "MYURL", CONFIG.API["AccessPoint"] );
			try{
				WalletHtml = WalletHtml.replace( /PAYTAKAADDRESS/g, (await new ACCOUNT.account(CONFIG.API.exchange["TAKAPrivkey"]).GetKeys())["address"] );
				WalletHtml = WalletHtml.replace( /PAYETAKAADDRESS/g, (await new ETHCOIND.ETHCoind(CONFIG.API.exchange["ETHPrivkey"]).GetKeys())["address"] );
			}catch(e){
				//pass
			};
			WalletHtml = Buffer.from(WalletHtml, 'utf-8');
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.end(WalletHtml);
		};
		if ((request.url).indexOf("/intro") != -1){
			let IntroHtml = FS.readFileSync('UI/intro.html');
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.end(IntroHtml);
		};
		if ((request.url).indexOf("/bootstrap") != -1){
			let bootstrap = FS.readFileSync('bootstrap/bootstrap.zip');
			response.writeHead(200, {'Content-Type': 'application/zip'});
			response.end(bootstrap);
		};

	}catch(e){
		MAIN.note(2,"RunAPIMethods",e);
		response.write(JSON.stringify(false));
		response.end();
	};
}