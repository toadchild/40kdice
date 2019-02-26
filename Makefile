INSTALL_PATH=/var/www/40k/dice/
TOKEN=$(shell date "+%s")

out: dice.js dice.html aos.html
	rm -rf out
	mkdir out
	cat dice.html | sed -e s/TOKEN/$(TOKEN)/ > out/dice.html
	cat aos.html | sed -e s/TOKEN/$(TOKEN)/ > out/aos.html
	cp dice.js out/dice-$(TOKEN).js

install: out
	rm $(INSTALL_PATH)/dice-*.js
	cp out/* $(INSTALL_PATH)
