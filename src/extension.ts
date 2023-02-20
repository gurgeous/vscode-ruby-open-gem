import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

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
    // quick sanity check - do this before we show any progress
    await this.sanity();

    // get list of gems (slow, w/ progress)
    const gems = await this.gems();

    // show quick pick
    const options = { placeHolder: "Select a gem to open" };
    const items = gems.map((gem) => ({ label: path.basename(gem), gem }));
    const selection = await vscode.window.showQuickPick(items, options);
    if (!selection) {
      return;
    }

    // and open
    const uri = vscode.Uri.file(selection.gem);
    vscode.commands.executeCommand("vscode.openFolder", uri, true);
  }

  //
  // quick sanity check before we do anything
  //

  async sanity() {
    const folders = vscode.workspace.workspaceFolders || [];
    if (folders.length === 0) {
      throw new Error("No folder open.");
    }
    if (folders.length !== 1) {
      throw new Error("Only works with a single folder.");
    }
    if (!(await exists(path.join(this.root, "Gemfile")))) {
      throw new Error("No Gemfile found.");
    }
  }

  //
  // get gem dirs from bundler
  //

  async gems(): Promise<string[]> {
    let gems: string[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Ruby Open Gem: bundle list...",
      },
      async () => {
        // bundle check (slow)
        try {
          await this.execRoot("bundle check");
        } catch (e) {
          throw new Error("`bundle check` failed. Try bundle install?");
        }

        // bundle list --paths (slow)
        const { stdout } = await this.execRoot("bundle list --paths");
        gems = stdout.trim().split("\n");
      }
    );
    return gems;
  }

  //
  // helpers
  //

  // asyncExec, with cwd set to the workspace root
  async execRoot(cmd: string): Promise<{ stdout: string; stderr: string }> {
    return asyncExec(cmd, { cwd: this.root });
  }

  get root(): string {
    return vscode.workspace.workspaceFolders![0].uri.fsPath;
  }
}

//
// other helpers
//

const asyncExec = promisify(cp.exec);
const asyncStat = promisify(fs.stat);

async function exists(path: string): Promise<boolean> {
  try {
    await asyncStat(path);
    return true;
  } catch (e) {
    return false;
  }
}
