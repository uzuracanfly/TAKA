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


## Contribution

### Hash

	https://github.com/emn178/js-sha256

	https://github.com/emn178/js-sha512

### Signature

	https://github.com/cyph/supersphincs

### Encryption

	https://github.com/ricmoo/aes-js



## Licence

Copyright [2019] [uzuracanfly]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Author

[uzuracanfly](https://github.com/uzuracanfly)