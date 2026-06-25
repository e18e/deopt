# @e18e/deopt

A collection of tools for tracing, visualizing and debugging deoptimization in Node.js/v8.

## Install

```sh
npm i -g @e18e/deopt

# or just npx it
npx @e18e/deopt foo.js
```

## Usage

Run a script, then open the deoptimization visualization in your browser:

```sh
# run a script under the current node
npx @e18e/deopt app.js

# pass arguments to your script
npx @e18e/deopt app.js --some-flag

# use a specific runtime and/or node flags
npx @e18e/deopt node --allow-natives-syntax app.js
npx @e18e/deopt /path/to/node app.js
npx @e18e/deopt d8 app.js
```

Open an existing v8 log without running anything:

```sh
npx @e18e/deopt v8.log
```

You can produce such a log yourself by running node with the relevant
v8 logging flags:

```sh
node --log-ic --log-deopt --log-code --logfile=v8.log --no-logfile-per-isolate app.js
```

Pass options to `deopt` itself before a `--` separator:

```sh
npx @e18e/deopt <options> -- app.js --some-flag
```

Run `npx @e18e/deopt --help` for the full list of options.

## Prior art

This was originally forked from [deoptigate](https://github.com/thlorenz/deoptigate) and heavily reworked. Huge thanks to [@thlorenz](https://github.com/thlorenz) for the original work and inspiration.

## License

MIT
