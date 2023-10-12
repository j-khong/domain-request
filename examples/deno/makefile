ENTRY_POINT := tools/cli.ts
ALLOWS := --allow-env --allow-net --allow-read
GENERATED_CLIENT_FOLDER := ./client
CONFIG := --config ./deno.json

.PHONY: all
all: launch-server

.PHONY: launch-server
launch-server: install
	~/.deno/bin/denon run $(ALLOWS) $(ENTRY_POINT) launch-server --settings ./conf.json

.PHONY: install
install:
	@which deno 1>$$TMPDIR/null && : || { \
	echo '⚙️ installing deno...'; \
	curl -fsSL https://deno.land/x/install/install.sh | sh ; \
	echo '✅ done'; \
	echo '⚙️ installing denon...'; \
	deno install --allow-read --allow-run --allow-write -f --unstable https://deno.land/x/denon/denon.ts; \
	echo '✅ done'; } && \
	echo '⚙️ linking code...' && \
	[ -L src/app ] && rm src/app || : && \
	cd src && ln -s ../../src/app && cd - && \
	[ -L src/interfaces/api ] && rm src/interfaces/api || : && \
	cd src/interfaces && ln -s ../../../src/interfaces/api && \
	echo '✅ done'

.PHONY: build
build: format lint
	 deno check $(ENTRY_POINT)

.PHONY: format
format:
	deno fmt $(CONFIG)

.PHONY: lint
lint:
	deno lint $(CONFIG)

.PHONY: gen-deno-client
gen-deno-client: set-deno-client gen-client
	@echo '⚙️ formatting client sources...' && \
	deno fmt $(CONFIG) $(GENERATED_CLIENT_FOLDER) && \
	echo '✅ done'

.PHONY: gen-node-client
gen-node-client: set-node-client gen-client

.PHONY: set-deno-client
set-deno-client: 
	$(eval CLIENT_TYPE := gen-deno-client)

.PHONY: set-node-client
set-node-client: 
	$(eval CLIENT_TYPE := gen-node-client)

.PHONY: gen-client
gen-client:
	@[ -d "$(GENERATED_CLIENT_FOLDER)" ] && rm -fr "$(GENERATED_CLIENT_FOLDER)" || : && \
	echo '⚙️ generating client...' && \
	deno run  --allow-env --allow-net --allow-read --allow-write tools/cli.ts $(CLIENT_TYPE) --dest-folder $(GENERATED_CLIENT_FOLDER) --roles admin && \
	echo '✅ done'

.PHONY: run-deno-example
run-deno-example: check-server gen-deno-client
	@echo '🚀 launching the client' && \
	deno run --allow-net example/client.ts

.PHONY: check-server
check-server:
	@curl "http://localhost:8080" 1>/tmp/dumb 2>/tmp/dumb && : || { \
    echo "please launch the server first"; \
	exit 1 ; }