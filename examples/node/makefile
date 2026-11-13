SETTINGS_FILE := ./conf.json
GENERATED_CLIENT_FOLDER := ./client

.PHONY: all
all: launch-server

.PHONY: launch-server
launch-server: install
	@echo '🚀 launching the server' && \
	npx ts-node-dev -r tsconfig-paths/register --respawn tools/cli.ts launch-server --settings=$(SETTINGS_FILE)

.PHONY: install
install:
	@[ -d ../../npm ] || $(MAKE) build-lib && \
	echo '⚙️ installing deps...' && \
	npm i && \
	echo '✅ done' && \
	echo '⚙️ linking code...' && \
	[ -L src/app ] && rm src/app || : && \
	cd src && ln -s ../../src/app && cd - && \
	[ -L src/interfaces/api ] && rm src/interfaces/api || : && \
	cd src/interfaces && ln -s ../../../src/interfaces/api && \
	echo '✅ done'


.PHONY: build-lib # build the npm package of the library from the sources of this repository
build-lib:
	@echo '⚙️ building the library...' && \
	$(MAKE) -C ../.. npm-create && \
	echo '✅ done'

.PHONY: gen-client
gen-client:
	@[ -d "$(GENERATED_CLIENT_FOLDER)" ] && rm -fr "$(GENERATED_CLIENT_FOLDER)" || : && \
	echo '⚙️ generating client...' && \
	npx ts-node-dev -r tsconfig-paths/register tools/cli.ts gen-node-client --dest-folder $(GENERATED_CLIENT_FOLDER) --roles admin && \
	echo '✅ done'

.PHONY: format-gen-client
format-gen-client:
	@echo '⚙️ formatting client sources...' && \
	npx prettier --config .prettierrc --loglevel warn --write $(shell find $(GENERATED_CLIENT_FOLDER) -name "*.ts") && \
	echo '✅ done'

.PHONY: run-node-example
run-node-example: check-server gen-client format-gen-client
	echo '🚀 launching the client' && \
	npx ts-node-dev -r tsconfig-paths/register example/client.ts

.PHONY: check-server
check-server:
	@curl "http://localhost:"$(shell cat conf.json | jq .server.port) 1>/tmp/dumb 2>/tmp/dumb && : || { \
    echo "please launch the server first"; \
	exit 1 ; }