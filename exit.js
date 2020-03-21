const CONFIG = require('./config.js');
const MAIN = require('./main.js');
const DATABASE = new (require('./database.js')).ChangeMemDatabase(CONFIG.database["address"],CONFIG.database["port"],CONFIG.database["database"]);







exports.OrderStop = async function(ProcessName){
	await DATABASE.set("OrderStop",ProcessName,[{"TimeStamp":await MAIN.GetTime(),"ProcessName":ProcessName}]);
	return 1;
}





exports.RunStop = async function(){
	let ProcessName = process.title;


	let OrderStopList = await DATABASE.get("OrderStop",ProcessName);

	OrderStopList = await DATABASE.get("OrderStop",ProcessName);
	if (OrderStopList.length == 0){
		return false;
	}

	await DATABASE.set("OrderStop",ProcessName,[]);

	process.exit(1);

	return true;
}
