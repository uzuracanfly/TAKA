exports.MAIN = function(runnerkeys,args,data){
	let address = runnerkeys["address"];

	if (!(address in data)){
		return {"result":0,"SetData":data};
	};

	return {"result":data[address]["balance"],"SetData":data};
}