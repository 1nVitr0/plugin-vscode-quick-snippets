import { glob } from "glob";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Mocha from "mocha";
import { resolve } from "path";
import { commands } from "vscode";

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({ ui: "tdd", color: true });

  const testsRoot = resolve(__dirname, "..");

  return new Promise(async (c, e) => {
    await commands.executeCommand("workbench.action.closeEditorsInGroup");
    const files = await glob("**/**.test.js", { cwd: testsRoot });

    // Add files to the test suite
    files.forEach((f) => mocha.addFile(resolve(testsRoot, f)));

    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) e(new Error(`${failures} tests failed.`));
        else c();
      });
    } catch (err) {
      console.error(err);
      e(err);
    }
  });
}
