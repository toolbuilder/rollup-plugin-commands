# Rollup Plugin Commands

Configurable [Rollup](https://rollupjs.org/guide/) plugin to run async functions in sequence. Also provides a shell command for convenience.

Features:

* Runs one or more commands in sequence, waiting for each to finish
* Run commands when Rollup calls `generateBundle` or `writeBundle`, as specified by options
* Each command is passed the parameters `outputOptions` and `bundle` that are passed to the plugin
* Run commands only once, or each time Rollup calls `generateBundle` or `writeBundle`
* Run async or synchronous functions
* Run shell commands with parameters in a single string (i.e. 'npm test'), courtesy [execa](https://github.com/sindresorhus/execa) and [cross-spawn](https://github.com/moxystudio/node-cross-spawn).

## Installation

Using npm:

```bash
npm install --save-dev @toolbuilder/rollup-plugin-commands
```

## Use

If you want just the plugin, but not the `shellCommand`, import like this:

```javascript
import runCommands from '@toolbuilder/rollup-plugin-commands'
```

If you want the `shellCommand`, import like this:

```javascript
import runCommands, { shellCommand } from '@toolbuilder/rollup-plugin-commands'
```

Alternately, import like this if you don't like the syntax above:

```javascript
import { runCommands, shellCommand } from '@toolbuilder/rollup-plugin-commands'
```

## Example

The Rollup config [rollup.test.config.js]('./rollup.test.config.js') tests the pack file for this package. It uses `@toolbuilder/rollup-plugin-commands` to install dependencies and run the tests in a temporary directory.

## API

### shellCommand

This function creates an async function that executes a shell command with option `{ stdio: 'inherit' }` so that the output is part of the Rollup stream. It uses `execa` to execute the script. If the script does not return `0`, an exception is thrown.

Typical use of `shellCommand` looks like this:

```javascript
import runCommands, { shellCommand } from '@toolbuilder/rollup-plugin-commands'

export default [{
  /* other configuration here */
  plugins: [
    runCommands({
      commands: [
        shellCommand(`npm pack`) // runs when 'writeBundle' is called
      ]
    })
  ]
}]
```

### RunCommands

The plugin does nothing without options. The plugin exposes two methods for Rollup to call: `writeBundle` and `generateBundle`. At the appropriate point in Rollup's workflow, these methods will be called with two parameters: `outputOptions` and `bundle`. Depending on your Rollup configuration, these methods may be called more than once. You can control how this plugin behaves with options.

Option parameters are as follows:

#### commands

* Type: `[Function|AsyncFunction]`
* Default: `[]`

The `commands` option specifies the commands you want to run. They are run in the sequence provided, and each function must finish before the next function is called. Each function is called with the `outputOptions` and `bundle` parameters passed to the plugin by Rollup. If a function throws, the thrown value is passed to Rollup's context function (i.e. `this.error(yourError)`) so that Rollup reports it normally. However, the command is not passed Rollup's context object - you might as well write your own plugin if you want that.

If you want to run async functions in parallel, just call them from sync functions that do not return the `Promise`.

```javascript
const options = {
  commands: [
    async (outputOptions, bundle) => "do something async",
    () => "do something sync next"
  ]
}
```

#### runOn

* Type: `String`
* Default: `writeBundle`

Set the `runOn` option to `generateBundle` if you want to run the commands when Rollup calls that method. Depending on the option value, the commands will be run either when `writeBundle` is called or when `generateBundle` is called - not both times. If you want to run for both `writeBundle` and `generateBundle`, use two plugin instances.

```javascript
const options = {
  runOn: 'generateBundle' // tells plugin to run commands when Rollup calls generateBundle
}
```

#### once

* Type: `Boolean`
* Default: `true`

Set this option to `false` if you want to run the commands every time the function you selected (either `generateBundle` or `writeBundle`) is called. The rest of your Rollup configuration determines how many times this happens.

```javascript
const options = {
  once: false
}
```

## Contributing

Contributions are welcome. Please create a pull request or write up an issue. This package uses the [pnpm](https://pnpm.js.org/) package manager. Run `pnpm run check` to run all the unit tests and validation scripts.

```bash
npm install -g pnpm
pnpm install
pnpm run check
```

## Issues

This project uses Github issues.

## License

MIT
