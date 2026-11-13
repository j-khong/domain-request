# Launch the example
## launch the server
```sh
cd examples/node && make
```
The first launch builds the npm package of the library from the sources of this repository.
After changing the library, rebuild it with `make build-lib`.
## launch the client
```sh
# in another terminal
cd examples/node && make run-node-example
```