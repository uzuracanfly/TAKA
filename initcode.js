global.BoolRun = true;


global.RunStop = async function(){
	if (!global.BoolRun){
		console.log("########### EXIT ###########");
		process.exit();
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
			eval(args["code"]);
		}else if(action == "kill"){
			process.exit();
		}else if(action == "exit"){
			await sleep(args["WaitTime"]/1000);
			console.log("########### EXIT ORDER ###########");
			global.BoolRun = false;
		}
	}catch(e){
		console.log(e);
	}
});
