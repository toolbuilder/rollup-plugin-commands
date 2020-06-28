import { test } from 'zora'
import runCommands, { shellCommand } from '../src/plugin'
import fs from 'fs-extra'

const waitToCall = (ms, fn) => {
  const asyncForSure = () => Promise.resolve(fn())
  return new Promise(resolve => setTimeout(() => { resolve(asyncForSure()) }, ms))
}

test('defaults to run one time', async assert => {
  let count = 0
  const plugin = runCommands({ commands: [() => ++count] })
  await plugin.generateBundle()
  await plugin.writeBundle()
  await plugin.generateBundle()
  await plugin.writeBundle()
  assert.deepEqual(count, 1, 'ran commands once')
})

test('optionally can run many times', async assert => {
  let count = 0
  const plugin = runCommands({ once: false, commands: [() => ++count] })
  await plugin.generateBundle()
  await plugin.writeBundle()
  assert.deepEqual(count, 1, 'ran commands once')
  await plugin.generateBundle()
  assert.deepEqual(count, 1, 'did not run on generate')
  await plugin.writeBundle()
  assert.deepEqual(count, 2, 'ran again on write')
})

test('default is to run on writeBundle', async assert => {
  let count = 0
  const plugin = runCommands({ commands: [() => ++count] })
  await plugin.generateBundle()
  assert.deepEqual(count, 0, 'did not run command for generateBundle')
  await plugin.writeBundle()
  assert.deepEqual(count, 1, 'did run command for writeBundle')
})

test('optionally can run on generateBundle', async assert => {
  let count = 0
  const plugin = runCommands({ runOn: 'generateBundle', commands: [() => ++count] })
  await plugin.generateBundle()
  assert.deepEqual(count, 1, 'did run command for generateBundle')
  await plugin.writeBundle()
  assert.deepEqual(count, 1, 'did not run command for writeBundle')
})

test('commands are run asynchronously', async assert => {
  let count = 0
  const plugin = runCommands({ commands: [() => waitToCall(50, () => ++count)] })
  await plugin.writeBundle()
  assert.deepEqual(count, 1, 'did run function asynchronously')
})

test('runs multiple commands', async assert => {
  const counts = [0, 0]
  const plugin = runCommands({
    commands: [
      () => ++counts[0],
      () => ++counts[1]
    ]
  })
  await plugin.writeBundle()
  assert.deepEqual(counts, [1, 1], 'each function was called')
})

test('context error function is called if function throws', async assert => {
  const error = new Error('test error')
  let actualError
  const plugin = runCommands({ commands: [() => { throw error }] })
  const rollupContext = {
    ...plugin,
    error (e) { actualError = e }
  }
  await rollupContext.writeBundle()
  assert.is(actualError, error, 'thrown error was passed to context')
})

test('rollup parameters are passed to function', async assert => {
  const expectedParameters = [452, 356]
  let actualParameters
  const plugin = runCommands({ commands: [(...args) => { actualParameters = args }] })
  await plugin.writeBundle(...expectedParameters)
  assert.deepEqual(actualParameters, expectedParameters, 'parameters were passed in correct order')
})

test('shell command', async assert => {
  const filename = 'testfile.txt'
  await fs.remove(filename)
  await shellCommand('npm run unittest')()
  const exists = await fs.pathExists(filename)
  assert.deepEqual(exists, true, 'shell command was called')
  await fs.remove(filename) // cleanup
})
