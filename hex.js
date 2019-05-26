/*
////////////////////////////////////////////
////////////////////////////////////////////
16進数文字列 <-> リトルエンディアンの16進数文字列
////////////////////////////////////////////
////////////////////////////////////////////
*/

exports.LittleEndian = class{

	constructor (){
		this.HexTextClass = new HexText();
	};


	/*
	バイト逆順16進数文字列
	*/
	GetLittleEndian(hex){
		////偶数ではないため偶数にするため先頭に0
		if (hex.length%2 != 0){
			hex = "0" + hex
		};


		var result = ""
		///// 2つ組ずつ逆順に並べ替える
		for (var i=hex.length-1; i>=1; i=i-2)
		{
			var targethex = hex[i-1]+hex[i];

			result = result + targethex;
		};

		return result
	};


	/*
	4バイト(8桁)逆順16進数文字列
	*/
	GetLittleEndianToUint32(hex){
		var result = ""
		///// 8つ組ずつ逆順に並べ替える
		for (var i=hex.length; i>0; i=i-8)
		{
			var targethex = hex.slice(i-8,i);

			result = result + targethex;
		};

		return result
	};


	/*
	バイト逆順16進数文字列 (固定数)
	*/
	GetLittleEndianFixed(hex, hexlength){
		var needzeroffill = hexlength-hex.length
		if (needzeroffill > 0){
			for (var i=needzeroffill;i>0;i--){
				hex = "0" + hex
			};
		};

		var hex = this.GetLittleEndian(hex);

		return hex;
	};


	/*
	4バイト(8桁)逆順16進数文字列 (固定数)
	*/
	GetLittleEndianFixedToUint32(hex, hexlength){
		var needzeroffill = hexlength-hex.length
		if (needzeroffill > 0){
			for (var i=needzeroffill;i>0;i--){
				hex = "0" + hex
			};
		};

		var hex = this.GetLittleEndianToUint32(hex);

		return hex;
	};



	/*
	バイト逆順16進数文字列 (サイズ指定された文字列)
	*/
	GetLittleEndianWithBytesLen(hex){
		let size = hex.length / 2;

		let hexsize = this.HexTextClass.number_to_utf8_hex_string(size);
		if (hexsize.length%2 != 0){
			hexsize = "0" + hexsize;
		};

		return hexsize + hex;
	};



};





/*
////////////////////////////////////////////
////////////////////////////////////////////
文字列 <-> 16進数
////////////////////////////////////////////
////////////////////////////////////////////
*/
exports.HexText = class{

	constructor (){};




	// 文字列をUTF8のバイト配列に変換
	string_to_utf8_bytes (text)
	{
		var result = [];
		if (text == null)
			return result;
		for (var i = 0; i < text.length; i++){
			var c = text.charCodeAt(i);
			if (c <= 0x7f) {
				result.push(c);
			} else if (c <= 0x07ff) {
				result.push(((c >> 6) & 0x1F) | 0xC0);
				result.push((c & 0x3F) | 0x80);
			} else {
				result.push(((c >> 12) & 0x0F) | 0xE0);
				result.push(((c >> 6) & 0x3F) | 0x80);
				result.push((c & 0x3F) | 0x80);
			}
		}
		return result;
	}

	// UTF8のバイト配列を文字列に変換
	utf8_bytes_to_string	(arr)
	{
		if (arr == null)
			return null;
		var result = "";
		var i;
		while (i = arr.shift()) {
			if (i <= 0x7f) {
				result += String.fromCharCode(i);
			} else if (i <= 0xdf) {
				var c = ((i&0x1f)<<6);
				c += arr.shift()&0x3f;
				result += String.fromCharCode(c);
			} else if (i <= 0xe0) {
				var c = ((arr.shift()&0x1f)<<6)|0x0800;
				c += arr.shift()&0x3f;
				result += String.fromCharCode(c);
			} else {
				var c = ((i&0x0f)<<12);
				c += (arr.shift()&0x3f)<<6;
				c += arr.shift() & 0x3f;
				result += String.fromCharCode(c);
			}
		}
		return result;
	}





	// 16進文字列をバイト値に変換
	hex_to_byte(hex_str)
	{
		return parseInt(hex_str, 16);
	}

	// バイト配列を16進文字列に変換
	hex_string_to_bytes(hex_str)
	{
		var result = [];

		for (var i = 0; i < hex_str.length; i+=2) {
			result.push(this.hex_to_byte(hex_str.substr(i,2)));
		}
		return result;
	}







	// バイト値を16進文字列に変換
	byte_to_hex(byte_num)
	{
		var digits = (byte_num).toString(16);
		if (byte_num < 16) return '0' + digits;
		return digits;
	}

	// バイト配列を16進文字列に変換
	bytes_to_hex_string(bytes)
	{
		var result = "";

		for (var i = 0; i < bytes.length; i++) {
			result += this.byte_to_hex(bytes[i]);
		}
		return result;
	}






	// 文字列をUTF8の16進文字列に変換
	string_to_utf8_hex_string (text)
	{
		var bytes1 = this.string_to_utf8_bytes(text);
		var hex_str1 = this.bytes_to_hex_string(bytes1);
		return hex_str1;
	}


	// UTF8の16進文字列を文字列に変換
	utf8_hex_string_to_string (hex_str1)
	{
		var bytes2 = this.hex_string_to_bytes(hex_str1);
		var str2 = this.utf8_bytes_to_string(bytes2);
		return str2;
	}








	// 数字を16進数文字列に変換
	number_to_utf8_hex_string (number)
	{
		return number.toString(16);
	}

	// 16進数文字列を数字に変換
	utf8_hex_string_to_number (text)
	{
		return parseInt(text, 16);
	}

};
