import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

//
// TODO
// - git
// - github
// - publish?
//

export function activate(context: vscode.ExtensionContext) {
  new RubyOpenGem(context);
}

class RubyOpenGem {
  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand("ruby-open-gem.open", this.onOpen.bind(this))
    );
  }

  async onOpen() {
    try {
      await this.onOpen0();
    } catch (e) {
      const msg = e instanceof Error ? e.message : `${e}`;
      vscode.window.showErrorMessage(`Ruby Open Gem: ${msg}`);
    }
  }

  async onOpen0() {
    // sanity check
    await this.sanity();

    // bundle list --paths
    const { stdout } = await this.execRoot("bundle list --paths");
    const dirs = stdout.trim().split("\n");

    // quick pick
    const options = { placeHolder: "Select a gem to open" };
    const items = dirs.map((dir) => ({ label: path.basename(dir), dir }));
    const selection = await vscode.window.showQuickPick(items, options);
    if (!selection) {
      return;
    }

    // open
    const uri = vscode.Uri.file(selection.dir);
    vscode.commands.executeCommand("vscode.openFolder", uri, true);
  }

  //
  // sanity check before we do anything
  //

  async sanity() {
    const folders = vscode.workspace.workspaceFolders || [];
    if (folders.length === 0) {
      throw new Error("No folder open.");
    }
    if (folders.length !== 1) {
      throw new Error("Only works with a single folder.");
    }
    if (!fs.existsSync(path.join(this.root, "Gemfile"))) {
      throw new Error("No Gemfile found.");
    }
    try {
      await this.execRoot("bundle check");
    } catch (e) {
      throw new Error("`bundle check` failed. Try bundle install?");
    }
  }

  //
  // helpers
  //

  // asyncExec, with cwd set to the workspace root
  async execRoot(cmd: string): Promise<{ stdout: string; stderr: string }> {
    const asyncExec = promisify(cp.exec);
    return asyncExec(cmd, { cwd: this.root });
  }

  get root(): string {
    return vscode.workspace.workspaceFolders![0].uri.fsPath;
  }
}
