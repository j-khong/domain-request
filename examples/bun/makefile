ENTRY_POINT := tools/cli.ts
GENERATED_CLIENT_FOLDER := ./client

.PHONY: all
all: launch-server

.PHONY: launch-server
launch-server: install
	@echo '🚀 launching the server' && \
	bun run --watch $(ENTRY_POINT) launch-server --settings ./conf.json
 
.PHONY: install
install: install-bun install-deps install-links

.PHONY: install-bun
install-bun:
	@which bun 1>$$TMPDIR/null && : || { \
	echo '⚙️ installing bun...'; \
	curl -fsSL https://bun.sh/install | bash ; \
	echo '✅ done'; }

.PHONY: install-deps
install-deps:
	@echo '⚙️ installing deps...' && \
	bun install && \
	sed -i -e '/^const _fdatasync/d' 'node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasync.js' && \
	sed -i -e '/^exports.fdatasync = _fdata/d' 'node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasync.js' && \
	echo 'exports.fdatasync = ()=>{};' >> 'node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasync.js' && \
	echo '✅ done'

.PHONY: install-links
install-links:
	@echo '⚙️ linking code...' && \
	[ -L src/app ] && rm src/app || : && \
	[ -d src/app ] && rm -fr src/app || : && \
	cd src && cp -fr ../../src/app . && cd - && \
	[ -L src/interfaces/api ] && rm src/interfaces/api || : && \
	[ -d src/interfaces/api ] && rm -fr src/interfaces/api || : && \
	cd src/interfaces && cp -fr ../../../src/interfaces/api . && cd - && \
	[ -L tools ] && rm tools || : && \
	[ -d tools ] && rm -fr tools || : && \
	cp -fr ../node/tools . && cd - && \
	echo '✅ done'

.PHONY: doc
doc: 
	# cd src && ln -s ../../src/app && cd - && \
	# [ -L src/interfaces/api ] && rm src/interfaces/api || : && \
	# [ -d src/interfaces/api ] && rm -fr src/interfaces/api || : && \
	# cd src/interfaces && ln -s ../../../src/interfaces/api && \

.PHONY: gen-client
gen-client:
	@[ -d "$(GENERATED_CLIENT_FOLDER)" ] && rm -fr "$(GENERATED_CLIENT_FOLDER)" || : && \
	echo '⚙️ generating client...' && \
	bun tools/cli.ts gen-node-client --dest-folder $(GENERATED_CLIENT_FOLDER) --roles admin && \
	echo '✅ done'

.PHONY: format-gen-client
format-gen-client:
	@echo '⚙️ formatting client sources...' && \
	npx prettier --config .prettierrc --loglevel warn --write $(shell find $(GENERATED_CLIENT_FOLDER) -name "*.ts") && \
	echo '✅ done'

.PHONY: run-node-example
run-node-example: check-server gen-client format-gen-client
	@echo '🚀 launching the client' && \
	[ -d example ] && rm -fr example || : && \
	cp -fr ../node/example . && \
	bun example/client.ts

.PHONY: check-server
check-server:
	@curl "http://localhost:"$(shell cat conf.json | jq .server.port) 1>/tmp/dumb 2>/tmp/dumb && : || { \
    echo "please launch the server first"; \
	exit 1 ; }

