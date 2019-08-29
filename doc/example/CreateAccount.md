CreateAccount
====

Goal

	Create Account.

# Using console
### Node Start.

	node init.js


### And type to console.

	node console.js getaccount


# Using library

### load library.

	<script src="https://neko.taka.site/lib/TAKALibRapper"></script>

### Using function.

	let TAKAKeys = await (new TAKA.ACCOUNT.account()).GetKeys();
	console.log(TAKAKeys);

* let TAKAKeys = await (new TAKA.ACCOUNT.account(key)).GetKeys();