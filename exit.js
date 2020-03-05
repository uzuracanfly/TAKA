const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);







exports.exit = async function(FunctionList){
	for (let index in FunctionList){
		try{
			let FunctionData = FunctionList[index];
			if (FunctionData["BoolKill"]){
				(FunctionData["child"]).send({"action":"kill","args":{}});
			}else{
				(FunctionData["child"]).send({"action":"exit","args":{"WaitTime":FunctionData["WaitTime"]}});
			}
		}catch(e){
			continue;
		}
	}
	process.exit(1);
}





exports.RunConfirmExit = async function(FunctionList){
	DATABASE.set("exitorder","live",[]);
	let ExitorderList = DATABASE.get("exitorder","live");
	while (true){
		try{
			ExitorderList = DATABASE.get("exitorder","live");
			if (ExitorderList.length > 0){
				await exports.exit(FunctionList);
			}

		}catch(e){
			MAIN.note(2,"exit_RunConfirmExit",e);
		}finally{
			await MAIN.sleep(1);
		}
	}
}





exports.SetExit = async function(){
	DATABASE.set("exitorder","live",["true"]);

	return true;
}