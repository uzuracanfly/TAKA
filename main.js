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


exports.GetFillZero = function(hex, hexlength){
	let needzeroffill = hexlength-hex.length;
	if (needzeroffill > 0){
		for (var i=needzeroffill;i>0;i--){
			hex = "0" + hex
		};
	};

	return hex;
};