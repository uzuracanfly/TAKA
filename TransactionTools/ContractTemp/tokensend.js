const tokenowner = "aa7223e10120f0aade2f37fb201e697f5ab8a3ec";
const PremineAmount = 100000000;


exports.MAIN = function(runnerkeys,args,data){
	let address = runnerkeys["address"];
	let toaddress = args["toaddress"];
	let amount = args["amount"];


	if (!(address in data)){
		if (tokenowner == address){
			data[address] = {
				"balance":PremineAmount
			}
		}else{
			data[address] = {
				"balance":0
			}
		};
	}
	if (!(toaddress in data)){
		data[toaddress] = {
			"balance":0
		}
	}


	if (data[address]["balance"] < amount) {
		return 0;
	};

	data[address]["balance"] = data[address]["balance"] - amount;
	data[toaddress]["balance"] = data[toaddress]["balance"] + amount;

	return {"result":true,"SetData":data};
}