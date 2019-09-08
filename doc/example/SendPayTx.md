SendPayTx
====

Goal

	Account A send 1TAKA to "80ba149c1e71ca4576198998418bc47d4e297ab2"


# Using console
### Node Start.

	node init.js

### And type to console.

	node console.js sendpaytx [MinPrivkey] 80ba149c1e71ca4576198998418bc47d4e297ab2 1

Check with [explorer](https://neko.taka.site/explorer) if it is sent properly.



# Using library

### load library.

	<script src="https://neko.taka.site/lib/TAKALibRapper"></script>

### Using function.
	(async () => {
		const TAKAFUNCTIONS = new TAKA.RappingFunctions("https://neko.taka.site");
		let txid = await TAKAFUNCTIONS.SendTransactionWithSendFee("[MinPrivkey]",1,"pay","80ba149c1e71ca4576198998418bc47d4e297ab2",1,"");
		console.log(txid);
	})();