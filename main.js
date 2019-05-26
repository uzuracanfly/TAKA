exports.note = function(stat,title,text){
	let result = "["+title+"]";
	if (stat == 1){
		result = result + "[INFO]";
	}
	if (stat == 2){
		result = result + "[WARN]";
	}
	if (stat == 3){
		result = result + "[ERRO]";
	}

	result = result + text;

	console.log(result);

	return result;
}