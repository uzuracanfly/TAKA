const FS = require('fs');
const SR = require('secure-random');
const IP = require('ip');
const CP = require('child_process');
const PATH = require('path');


const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');
const BOOTSTRAP = require('./bootstrap.js');
const EXIT = require('./exit.js');

(async () => {
	try{
		const CONFIG = require('./config.js');
	}catch(e){
		console.log("None Config!Setup Config!"+" : "+e);

		/*
			Configの設定
		*/
		let API_ADDRESS = await MAIN.GetConsole("[API] Use Address (0.0.0.0) : ");
		if (!API_ADDRESS){
			API_ADDRESS = "0.0.0.0";
		};
		let API_PORT = await MAIN.GetConsole("[API] Use Port (80) : ");
		if (!API_PORT){
			API_PORT = "80";
		};
		let API_ACCESSPOINT = await MAIN.GetConsole("[API] ACCESS POINT TO API (http://127.0.0.1) : ");
		if (!API_ACCESSPOINT){
			API_ACCESSPOINT = "http://"+IP.address()+":"+API_PORT;
		};


		let IMPORTTAGS = await MAIN.GetConsole('[ImportTags] ([]) : ');
		if (!IMPORTTAGS){
			IMPORTTAGS = "[]";
		};


		let TAGREWARD_MININGTAGS = await MAIN.GetConsole('[TagReward] Mining Tags ([]) : ');
		if (!TAGREWARD_MININGTAGS){
			TAGREWARD_MININGTAGS = "[]";
		};
		let TAGREWARD_COLLECTPRIVKEY = await MAIN.GetConsole('[TagReward] Collect Privkey () : ');
		if (!TAGREWARD_COLLECTPRIVKEY){
			TAGREWARD_COLLECTPRIVKEY = await new CRYPTO.signature().CreatePrivkey();
		}
		let TAGREWARD_CONTROLTAG = await MAIN.GetConsole('[TagReward] Use Control Tag (false) : ');
		if (!TAGREWARD_CONTROLTAG){
			TAGREWARD_CONTROLTAG = false;
		};



		let BOOTSTRAP_BOOL = await MAIN.GetConsole('[bootstrap] Use bootstrap(download the database from the other node.) (true) : ');
		if (!BOOTSTRAP_BOOL){
			BOOTSTRAP_BOOL = true;
		};



		if (BOOTSTRAP_BOOL != "false"){
			console.log("bootstrap downloading.....");
			let result = await BOOTSTRAP.DownloadDataBase("TAKA");
			if (result){
				console.log("done.");
			}else{
				console.log("error.");
			}
		}



		let ConfigData = FS.readFileSync("./config_sample.js", 'utf8');
		ConfigData = ConfigData.replace( 'API_ADDRESS', '"'+API_ADDRESS+'"' );
		ConfigData = ConfigData.replace( 'API_PORT', API_PORT );
		ConfigData = ConfigData.replace( 'API_ACCESSPOINT', '"'+API_ACCESSPOINT+'"' );

		ConfigData = ConfigData.replace( 'IMPORTTAGS', IMPORTTAGS );

		ConfigData = ConfigData.replace( 'TAGREWARD_MININGTAGS', TAGREWARD_MININGTAGS );
		ConfigData = ConfigData.replace( 'TAGREWARD_COLLECTPRIVKEY', '"'+TAGREWARD_COLLECTPRIVKEY+'"' );
		ConfigData = ConfigData.replace( 'TAGREWARD_CONTROLTAG', TAGREWARD_CONTROLTAG );

		FS.writeFile("./config.js", ConfigData, "utf8", (e) => {
			if (e) {
				console.log(e);
				throw e;
			}

			console.log("Done!Restart please!");
			process.exit(0);
		});
		return 1;
	}





	let FunctionList = [
		{"name":"DatabaseRunCommit","ProcessName":"DRC","function":"let Database = require('./database.js');Database.RunCommit()","time":0,"child":null,"BoolKill":true,"WaitTime":15},
		{"name":"TransactionRunGetNonce","ProcessName":"TRG","function":"let Transaction = require('./transaction.js');Transaction.RunGetNonce()","time":0,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"TransactionRunCommit","ProcessName":"TRC","function":"let Transaction = require('./transaction.js');Transaction.RunCommit()","time":1,"child":null,"BoolKill":false,"WaitTime":0},
		{"name":"BroadcastSetServer","ProcessName":"BCS","function":"let Broadcast = require('./broadcast.js');Broadcast.SetServer()","time":2,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"BroadcastSetClient","ProcessName":"BCC","function":"let Broadcast = require('./broadcast.js');Broadcast.SetClient()","time":2,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"APISetServer","ProcessName":"ASR","function":"let API = require('./api.js');API.SetServer()","time":2,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"TagrewardRunMining","ProcessName":"TRR","function":"let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunMining()","time":3,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"exchange","ProcessName":"EXC","function":"let EXCHANGE = require('./exchange.js');EXCHANGE.RunExchangeScan()","time":3,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"ControlTag","ProcessName":"CRT","function":"let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunControlTag()","time":3,"child":null,"BoolKill":true,"WaitTime":0},
		{"name":"bootstrap","ProcessName":"BSS","function":"let BOOTSTRAP = require('./bootstrap.js');BOOTSTRAP.RunSaveDataBase()","time":3,"child":null,"BoolKill":true,"WaitTime":0},
		{
			"name":"TEST",
			"ProcessName":"TES",
			"function":"\
				const FS = require('fs');\
				FS.stat('./test.js', (error, stats) => {\
					if (!error) {\
						let TEST = require('./test.js');\
						TEST.main();\
					}\
				})\
			",
			"time":4,
			"BoolKill":true,
			"WaitTime":0,
		},
	];





	if (process.argv[2] == "start"){
		for (let index in FunctionList) {
			let FunctionData = FunctionList[index];

			(async () => {
				await MAIN.sleep(FunctionData["time"]);

				let child = CP.fork(`initcode.js`);
				child.send({"action":"run","args":{"code":FunctionData["function"],"ProcessName":FunctionData["ProcessName"]}});
				child.on('error', (e) => {
					console.log(`[ERROR]`);
					console.log(e);
				});
			})();
		}
	}else if (process.argv[2] == "kill"){
		for (let index in FunctionList){
			let FunctionData = FunctionList[index];

			CP.exec(`pkill -9 ${FunctionData["ProcessName"]}`);
		}
	}else if (process.argv[2] == "stop"){
		for (let index in FunctionList){
			(async () => {
				let FunctionData = FunctionList[index];

				await MAIN.sleep(FunctionData["WaitTime"]);

				if (FunctionData["BoolKill"]){
					CP.exec(`pkill -9 ${FunctionData["ProcessName"]}`);
				}else{
					await EXIT.OrderStop(FunctionData["ProcessName"]);
				}
			})();
		}
	}
})();