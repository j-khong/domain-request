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
# the mysql driver of the tests depends on an unpinned std module removed since: unit-tests-new/import_map.json pins it
UNIT_TESTS_API ?= old

.PHONY: db-up # start mysql container if not already running
db-up:
	@docker inspect $(DB_CONTAINER) >/dev/null 2>&1 || \
		docker run --name $(DB_CONTAINER) \
		-e MYSQL_ROOT_PASSWORD=$(DB_PASSWORD) \
		-e MYSQL_DATABASE=$(DB_NAME) \
		-p $(DB_PORT):3306 \
		-d $(DB_IMAGE)
	@docker start $(DB_CONTAINER) >/dev/null 2>&1 || true

.PHONY: db-wait # wait until mysql is ready to accept connections
db-wait:
	@echo "Waiting for MySQL on container $(DB_CONTAINER)..."
	@until docker exec $(DB_CONTAINER) mysqladmin ping -h 127.0.0.1 -u$(DB_USER) -p$(DB_PASSWORD) --silent >/dev/null 2>&1; do \
		sleep 1; \
	done

.PHONY: db-init # initialize test schema and seed data
db-init: db-up db-wait
	@docker exec -i $(DB_CONTAINER) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME) < $(DB_SCHEMA)

.PHONY: db-down # stop mysql container
db-down:
	@docker stop $(DB_CONTAINER) >/dev/null 2>&1 || true

.PHONY: db-reset # drop and recreate schema in running container
db-reset: db-init

.PHONY: unit-tests # launch unit tests
unit-tests: db-init
	@echo ""
	@profile=$(UNIT_TESTS_API); \
	if [ "$$profile" != "old" ] && [ "$$profile" != "new" ]; then \
		echo "UNIT_TESTS_API must be 'old' or 'new' (got: $$profile)"; \
		exit 1; \
	fi; \
	d=$$(date +%s); \
	UNIT_TESTS_API=$$profile DB_NAME=$(DB_NAME) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) \
	deno test --allow-all --import-map=unit-tests-new/import_map.json $(TEST_FLAGS) unit-tests-new/index.ts > unit-tests.log 2>&1 && \
	echo "✅ Tests ($$profile) took $$(($$(date +%s)-d)) seconds" || \
	{ echo "❌ Tests ($$profile) failed after $$(($$(date +%s)-d)) seconds (check unit-tests.log)"; exit 1; }

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
