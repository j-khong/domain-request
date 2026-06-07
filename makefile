# https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
TESTS_REPORT := tests-report
COVERAGE_OPTION := --trace-ops --coverage=$(TESTS_REPORT)/cov_profile

.PHONY: unit-tests # launch unit tests
unit-tests:
	d=$$(date +%s); \
	deno test --allow-all unit-tests-new/index.ts && \
	echo "Tests took $$(($$(date +%s)-d)) seconds"

.PHONY: tests-coverage # generate tests coverage report
tests-coverage:
# brew install lcov
	[ ! -d $(TESTS_REPORT) ] && make unit-tests || : && \
	deno coverage $(TESTS_REPORT)/cov_profile --lcov --output=$(TESTS_REPORT)/cov_profile.lcov && \
	genhtml -o $(TESTS_REPORT)/cov_profile/html $(TESTS_REPORT)/cov_profile.lcov && \
	open $(TESTS_REPORT)/cov_profile/html/index.html

.PHONY: labo
labo:
	deno run --inspect --allow-all ./unit-tests-new/labo.ts
#deno run --allow-net unit-tests-new/labo.ts

.PHONY: lint
lint:
	deno lint src

.PHONY: help # Generate list of targets with descriptions
help:
	@grep '^.PHONY: .* #' Makefile | sed 's/\.PHONY: \(.*\) # \(.*\)/\1 	 \2/' | expand -t30


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
npm-publish:
	make npm-create || : && \
	cd npm && npm publish --access public