process.on('message', async function(data) {
	try{
		let action = data["action"];
		let args = data["args"];

		if (action == "run"){
			process.title = args["ProcessName"];
			eval(args["code"]);
		}
	}catch(e){
		console.log(e);
	}
});