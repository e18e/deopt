# @e18e/deopt

A collection of tools for tracing, visualizing and debugging deoptimization in Node.js/v8.

## What is this?

When running JavaScript in an engine backed by v8 (like Node.js and Chrome), v8 will often optimize your code when it is being executed many times.

If your code ends up optimized, then is called in a way that surprises v8, it will become _deoptimized_. For example, if a function repeatedly operates on objects of the same shape, and is then passed an object with a different shape, v8 will deoptimize the function and fall back to the slower, unoptimized bytecode.

You can learn a lot about these optimizations on the [v8 website](https://v8.dev/). For example, there is a useful doc explaining [hidden classes in v8](https://v8.dev/docs/hidden-classes). Mathias Bynens also has a super useful blog post about [shapes and inline caches](https://mathiasbynens.be/notes/shapes-ics).

## Use with care :boom:

If you resolve all of the diagnostics, you'll generally end up with incredibly performant code **for v8** and **this version of v8**.

As new versions of v8 are released, the optimizations and deoptimizations may change. So while you may have a perfectly optimized function in Node.js 20, it may optimize differently in Node.js 22.

It seems unlikely the more common optimizations would ever stop being applied, though. It is well worth doing some learning on the subject so you can make a call per diagnostic.

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
