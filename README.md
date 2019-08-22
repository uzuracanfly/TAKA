TAKA
====

Distributed large capacity database.

## Description
TAKA is a P2P network for managing big data in a distributed manner.

	・ Original currency function
	・ Database function
	・ Smart contract function

## Usage
After installation and node start.

### Generate Account In the API

    sudo curl http://127.0.0.1 -d '{"function":"getaccount","args":{"key":""}}'

### Show Account In the API

    sudo curl http://127.0.0.1 -d '{"function":"getaccount","args":{"key":"eb86950b214dea4c863d10c5c0fa22fd027647ca"}}'

### Access Web GUI

	http://127.0.0.1/wallet
	http://127.0.0.1/explorer


## Install
You need Node.js version 10 or higher.

	https://nodejs.org/

Download TAKA.

	git clone https://github.com/uzuracanfly/TAKA.git

Start TAKA node.

	cd TAKA
	npm install
	node init.js

### [OPTION] Using Firejail

	apt-get install firejail

Open and edit config.js
	
	"UsingFirejail":false

To

	"UsingFirejail":true


## Contribution

### Hash

	https://github.com/emn178/js-sha256

	https://github.com/emn178/js-sha512

### Signature

	https://github.com/cyph/supersphincs

### Encryption

	https://github.com/ricmoo/aes-js



## Licence

<a rel="license" href="http://creativecommons.org/licenses/by-nd/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nd/4.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">TAKA</span> by <span xmlns:cc="http://creativecommons.org/ns#" property="cc:attributionName">uzuracanfly</span> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nd/4.0/">Creative Commons Attribution-NoDerivatives 4.0 International License</a>.


## Author

[uzuracanfly](https://github.com/uzuracanfly)