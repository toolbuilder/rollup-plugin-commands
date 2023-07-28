import createTestPackageJson from 'rollup-plugin-create-test-package-json'
import multiInput from 'rollup-plugin-multi-input'
import createPackFile from '@toolbuilder/rollup-plugin-create-pack-file'
import runCommands, { shellCommand } from './src/plugin.js'
import { tmpdir } from 'os'
import { join } from 'path'

/*
  This Rollup configuration tests this 'rollup-plugin-commands' package three ways:

    * The plugin is used in this configuration to generate two temporary test packages
    * The plugin unit tests are run in the two packages to ensure the packfile is ok:
      * One test package is a CJS package
      * The other is an ES package
*/

// Two different test packages are created, both in
// subdirectories of this directory
const testPackageBaseDir = join(tmpdir(), `${Date.now()}`)

// We need to test from an ES package and a CJS package
// So setup two different packageJson configurations
// here, and two different package locations.
// Then merge them with the common Rollup configuration
// elements using a map operation.
const testEnvironments = [
  {
    testPackageJson: { // CJS test project.json
      scripts: {
        // the unittest script is run by the unit test to check shellCommand
        unittest: 'npm --version > testfile.txt',
        test: 'tape -r esm test/**/*test.js | tap-nirvana'
      },
      devDependencies: {
        // These are the dependencies for the test runner
        esm: '^3.2.25',
        rollup: '^2', // to satisfy peerDependencies
        tape: '^5.0.1',
        'tap-nirvana': '^1.1.0'
      }
    },
    testPackageDir: join(testPackageBaseDir, 'cjs')
  },
  {
    testPackageJson: { // ES test project.json
      type: 'module',
      // no need to specify a valid main or exports since
      // we are only running test scripts, there is no package code
      scripts: {
      // the unittest script is run by the unit test to check shellCommand
        unittest: 'npm --version > testfile.txt',
        test: 'pta --reporter tap "test/**/*test.js"'
      },
      // dependencies are populated automatically
      devDependencies: {
      // These are the dependencies for the test runner
        pta: '^1.2.0'
      }
    },
    testPackageDir: join(testPackageBaseDir, 'es')
  }
]

// Rollup will process an Array of configurations...
export default testEnvironments.map(({ testPackageJson, testPackageDir }) => {
  return {
    // process all unit tests, and specify output in 'test' directory of testPackageDir
    input: ['test/**/*test.js'],
    preserveModules: true, // Generate one unit test for each input unit test
    output: {
      // it's ok that the unit tests are in ES format for both CJS and ES packages
      // because we use esm to enable ES execution in the CJS package.
      format: 'es',
      dir: testPackageDir
    },
    plugins: [
      multiInput(), // Handles the input glob above
      createTestPackageJson({ // Creates package.json for testPackageDir
        // Provide information that plugin can't pick up for itself
        testPackageJson
      }),
      createPackFile({ // and move it to output.dir (i.e. testPackageDir)
        packCommand: 'pnpm pack'
      }),
      runCommands({
        commands: [
          // Install dependencies and run the unit test
          shellCommand(`pnpm -C ${testPackageDir} install-test`)
        ]
      })
    ]
  }
})
