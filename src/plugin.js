import execa from 'execa'

export const shellCommand = (cmdString) => {
  return () => execa.command(cmdString, { stdio: 'inherit' })
}

export const runCommands = (userOptions = {}) => {
  const options = {
    once: true,
    runOn: 'writeBundle',
    commands: [],
    ...userOptions
  }
  let runCount = 0
  const runCountOk = () => !(options.once && runCount > 0)
  const runCommands = async (context, outputOptions, bundle) => {
    ++runCount
    try {
      for (const commandFunction of options.commands) {
        await commandFunction(outputOptions, bundle)
      }
    } catch (error) {
      context.error(error)
    }
  }
  return {
    name: 'run-commands',
    async generateBundle (outputOptions, bundle) {
      if (options.runOn !== 'writeBundle' && runCountOk()) await runCommands(this, outputOptions, bundle)
    },
    async writeBundle (outputOptions, bundle) {
      if (options.runOn === 'writeBundle' && runCountOk()) await runCommands(this, outputOptions, bundle)
    }
  }
}

export default runCommands
