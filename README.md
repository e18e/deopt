# @e18e/deopt

A collection of tools for tracing, visualizing and debugging deoptimization in Node.js/v8.

## What is this?

When running JavaScript in an engine backed by v8 (like Node.js and Chrome), v8 will often optimize your code when it is being executed many times.

If your code ends up optimized, then is called in a way that surprises v8, it will become _deoptimized_. For example, if a function repeatedly operates on objects of the same shape, and is then passed an object with a different shape, v8 will deoptimize the function and fall back to the slower, unoptimized bytecode.

You can learn a lot about these optimizations on the [v8 website](https://v8.dev/). For example, there is a useful doc explaining [hidden classes in v8](https://v8.dev/docs/hidden-classes). Mathias Bynens also has a super useful blog post about [shapes and inline caches](https://mathiasbynens.be/notes/shapes-ics).

## Use with care :boom:

If you resolve all of the diagnostics, you'll generally end up with incredibly performant code **for v8** and **this version of v8**.

However, there are a few things to note:

- v8 changes over time, and so do the optimizations
- we should raise bugs in v8 for notable slow syntax rather than working around it
- other engines (non-v8) will have different optimizations, and it is unlikely you can write code that is optimal for all of them
- different versions of v8 (and thus Node.js) may optimize code differently

Many of the more common optimizations (e.g. consistent shapes of objects) seem unlikely to ever stop being optimized. These are the ones worth focusing on rather than the more niche ones.

It is worth doing some reading on "crankshaftscript" to see where over-optimizing for a specific engine can go wrong.

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

### Markdown report

Pass `--md` to print a concise markdown report to stdout instead of opening
the browser. The diagnostics are grouped by issue, each with the affected
locations and advice on how to address them. It works with any of the input
forms above:

```sh
npx @e18e/deopt --md app.js
npx @e18e/deopt --md v8.log
npx @e18e/deopt --md -- app.js --some-flag
```

This is intended for non-interactive use, such as feeding the results to an
AI agent. Status messages are written to stderr so stdout contains only the
report.

## Prior art

This was originally forked from [deoptigate](https://github.com/thlorenz/deoptigate) and heavily reworked. Huge thanks to [@thlorenz](https://github.com/thlorenz) for the original work and inspiration.

## License

MIT
