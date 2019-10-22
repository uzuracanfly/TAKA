SendData
====

Goal
<!--
	・Buy ETAKA
	・Exchange ETAKA to TAKA.
-->
	・Order tag.
	・Send Data To Datebase of TAKA.


# Using console
<!--
### Buy TAKA
To network usage fee.<br>
[Buy TAKA](https://github.com/uzuracanfly/TAKA/blob/master/doc/example/BuyTAKA.md).
-->

### Node Start.

	node init.js

### Tag Order
type to console.

	node console.js sendtagordertx [MinPrivkey] [TAG] 0 ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff 1000000

### Send 00ff To Database of [TAG].

	node console.js senddatabasetx [MinPrivkey] [TAG] [DATA]




# Using library
<!--
### Buy TAKA and Tag Order
-->
### Tag Order
[Using console](https://github.com/uzuracanfly/TAKA/blob/master/doc/example/SendData.md#using-console)

### load library.

	<script src="https://neko.taka.site/lib/TAKALibRapper"></script>

### Using function.

	const TAKAFUNCTIONS = new TAKA.RappingFunctions("https://neko.taka.site");
	let txid = await TAKAFUNCTIONS.SendTransactionWithSendFee("[MinPrivkey]",101,"[TAG]","",0,"[DATA]");
	console.log(txid);
