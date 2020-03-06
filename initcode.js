global.BoolRun = true;


global.RunStop = async function(){
	if (!global.BoolRun){
		console.log(`########### EXIT [${process.pid}] ###########`);
		process.exit(1);
	}
};


let sleep = function(msec){
	return new Promise(function(resolve) {
		setTimeout(function() {resolve()}, 1000*msec);
	})
}


process.on('message', async function(data) {
	try{
		let action = data["action"];
		let args = data["args"];

		if (action == "run"){
			process.title = args["name"];
			eval(args["code"]);
		}else if(action == "kill"){
			console.log(`########### EXIT [${process.pid}] ###########`);
			process.exit(1);
		}else if(action == "exit"){
			await sleep(args["WaitTime"]);
			console.log(`########### EXIT ORDER [${process.pid}] ###########`);
			global.BoolRun = false;
		}
	}catch(e){
		console.log(e);
	}
});
