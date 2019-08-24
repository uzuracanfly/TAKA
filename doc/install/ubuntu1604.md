TAKA install to ubuntu 16.04
====

You need Node.js version 10 or higher.

	curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
	sudo apt-get install -y nodejs

Download TAKA.

	git clone https://github.com/uzuracanfly/TAKA.git

Start TAKA node.

	cd TAKA
	npm install
	node init.js

### [OPTION] Using Firejail

	apt-get install firejail

And open and edit config.js

	"UsingFirejail":false

To

	"UsingFirejail":true