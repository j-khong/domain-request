# https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
TESTS_REPORT := tests-report
COVERAGE_OPTION := --trace-ops --coverage=$(TESTS_REPORT)/cov_profile
DB_CONTAINER := domain-request-mysql
DB_IMAGE := mysql:8.0
DB_NAME := domain-request
DB_USER := root
DB_PASSWORD := gWpYF4dZfW
DB_PORT := 8106
DB_SCHEMA := unit-tests-new/persistence/database/tables.sql
PG_CONTAINER := domain-request-postgres
PG_IMAGE := postgres:16
PG_NAME := domain_request
PG_USER := postgres
PG_PASSWORD := gWpYF4dZfW
PG_PORT := 8107
PG_SCHEMA := unit-tests-new/persistence/database/postgres.tables.sql
# the mysql driver of the tests depends on an unpinned std module removed since: unit-tests-new/import_map.json pins it
UNIT_TESTS_API ?= old
# database of the tests: mysql or postgres
UNIT_TESTS_DB ?= mysql

.PHONY: db-check # fail if UNIT_TESTS_DB is not a supported database
db-check:
	@if [ "$(UNIT_TESTS_DB)" != "mysql" ] && [ "$(UNIT_TESTS_DB)" != "postgres" ]; then \
		echo "UNIT_TESTS_DB must be 'mysql' or 'postgres' (got: $(UNIT_TESTS_DB))"; \
		exit 1; \
	fi

.PHONY: db-up # start the container of UNIT_TESTS_DB if not already running
db-up: db-check
	@if [ "$(UNIT_TESTS_DB)" = "postgres" ]; then \
		docker inspect $(PG_CONTAINER) >/dev/null 2>&1 || \
			docker run --name $(PG_CONTAINER) \
			-e POSTGRES_USER=$(PG_USER) \
			-e POSTGRES_PASSWORD=$(PG_PASSWORD) \
			-e POSTGRES_DB=$(PG_NAME) \
			-p $(PG_PORT):5432 \
			-d $(PG_IMAGE); \
		docker start $(PG_CONTAINER) >/dev/null 2>&1 || true; \
	else \
		docker inspect $(DB_CONTAINER) >/dev/null 2>&1 || \
			docker run --name $(DB_CONTAINER) \
			-e MYSQL_ROOT_PASSWORD=$(DB_PASSWORD) \
			-e MYSQL_DATABASE=$(DB_NAME) \
			-p $(DB_PORT):3306 \
			-d $(DB_IMAGE); \
		docker start $(DB_CONTAINER) >/dev/null 2>&1 || true; \
	fi

.PHONY: db-wait # wait until the database is ready to accept connections
db-wait: db-check
	@if [ "$(UNIT_TESTS_DB)" = "postgres" ]; then \
		echo "Waiting for PostgreSQL on container $(PG_CONTAINER)..."; \
		until docker exec $(PG_CONTAINER) pg_isready -h 127.0.0.1 -U $(PG_USER) -d $(PG_NAME) >/dev/null 2>&1; do \
			sleep 1; \
		done; \
	else \
		echo "Waiting for MySQL on container $(DB_CONTAINER)..."; \
		until docker exec $(DB_CONTAINER) mysqladmin ping -h 127.0.0.1 -u$(DB_USER) -p$(DB_PASSWORD) --silent >/dev/null 2>&1; do \
			sleep 1; \
		done; \
	fi

.PHONY: db-init # initialize test schema and seed data
db-init: db-up db-wait
	@if [ "$(UNIT_TESTS_DB)" = "postgres" ]; then \
		docker exec -i $(PG_CONTAINER) psql -q -v ON_ERROR_STOP=1 -U $(PG_USER) -d $(PG_NAME) < $(PG_SCHEMA); \
	else \
		docker exec -i $(DB_CONTAINER) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME) < $(DB_SCHEMA); \
	fi

.PHONY: db-down # stop the container of UNIT_TESTS_DB
db-down: db-check
	@if [ "$(UNIT_TESTS_DB)" = "postgres" ]; then \
		docker stop $(PG_CONTAINER) >/dev/null 2>&1 || true; \
	else \
		docker stop $(DB_CONTAINER) >/dev/null 2>&1 || true; \
	fi

.PHONY: db-reset # drop and recreate schema in running container of UNIT_TESTS_DB
db-reset: db-init

.PHONY: unit-tests # launch unit tests
unit-tests: db-init
	@echo ""
	@profile=$(UNIT_TESTS_API); \
	if [ "$$profile" != "old" ] && [ "$$profile" != "new" ]; then \
		echo "UNIT_TESTS_API must be 'old' or 'new' (got: $$profile)"; \
		exit 1; \
	fi; \
	if [ "$(UNIT_TESTS_DB)" = "postgres" ]; then \
		name=$(PG_NAME); port=$(PG_PORT); user=$(PG_USER); password=$(PG_PASSWORD); \
	else \
		name=$(DB_NAME); port=$(DB_PORT); user=$(DB_USER); password=$(DB_PASSWORD); \
	fi; \
	d=$$(date +%s); \
	TZ=UTC UNIT_TESTS_API=$$profile UNIT_TESTS_DB=$(UNIT_TESTS_DB) DB_NAME=$$name DB_PORT=$$port DB_USER=$$user DB_PASSWORD=$$password \
	deno test --allow-all --import-map=unit-tests-new/import_map.json $(TEST_FLAGS) unit-tests-new/index.ts > unit-tests.log 2>&1 && \
	echo "✅ Tests ($$profile, $(UNIT_TESTS_DB)) took $$(($$(date +%s)-d)) seconds" || \
	{ echo "❌ Tests ($$profile, $(UNIT_TESTS_DB)) failed after $$(($$(date +%s)-d)) seconds (check unit-tests.log)"; exit 1; }

.PHONY: tests-coverage # generate tests coverage report
tests-coverage:
# brew install lcov
	rm -fr $(TESTS_REPORT)
	$(MAKE) unit-tests TEST_FLAGS="$(COVERAGE_OPTION)"
	deno coverage $(TESTS_REPORT)/cov_profile --lcov --output=$(TESTS_REPORT)/cov_profile.lcov
	genhtml -o $(TESTS_REPORT)/cov_profile/html $(TESTS_REPORT)/cov_profile.lcov
	open $(TESTS_REPORT)/cov_profile/html/index.html

.PHONY: labo
labo:
	deno run --inspect --allow-all ./unit-tests-new/labo.ts
#deno run --allow-net unit-tests-new/labo.ts

.PHONY: lint # lint the library (explicit any are still too numerous to be forbidden)
lint:
	deno lint --rules-exclude=no-explicit-any src

.PHONY: check # type check the library entry points
check:
	deno check src/index.ts src/tools.ts

.PHONY: help # Generate list of targets with descriptions
help:
	@grep '^.PHONY: .* #' $(firstword $(MAKEFILE_LIST)) | sed 's/\.PHONY: \(.*\) # \(.*\)/\1 	 \2/' | expand -t30


.PHONY: save
save:
	rm -fr $(TESTS_REPORT)
	rsync -av --delete --exclude "node_modules" --exclude "npm" --exclude "dist" --exclude "to_deploy" --exclude ".git" --exclude ".DS_Store" . "/Users/jk/julienkhong@yahoo.fr - Google Drive/My Drive/back-ups/domain-request/"


.PHONY: npm-create
npm-create:
	[ -d examples/node/node_modules ] && rm -fr examples/node/node_modules || : && \
	[ -d npm ] && rm -fr npm || : && \
	deno run -A scripts/build_npm.ts $(shell cat current_version.txt)

.PHONY: npm-publish
npm-publish: npm-create
	cd npm && npm publish --access public
