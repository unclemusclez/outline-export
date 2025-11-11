import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('fileOutlineExtractor.printOutline', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor!');
      return;
    }

    const uri = editor.document.uri;
    if (editor.document.languageId !== 'python') {
      vscode.window.showWarningMessage('This is optimized for Python files.');
    }

    // Execute the document symbol provider (uses LSP from Python extension)
    const symbols: vscode.DocumentSymbol[] | undefined = await vscode.commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      uri
    );

    if (!symbols || symbols.length === 0) {
      vscode.window.showInformationMessage('No symbols found in this file.');
      return;
    }

    // Recursively build a structured outline (e.g., as a tree)
    function buildOutline(symbol: vscode.DocumentSymbol, indent: string = ''): string {
      let outline = `${indent}- ${symbol.name} (${symbol.kind}) [Lines ${symbol.range.start.line + 1}-${symbol.range.end.line + 1}]\n`;
      for (const child of symbol.children) {
        outline += buildOutline(child, indent + '  ');
      }
      return outline;
    }

    // Collect all top-level symbols
    let fullOutline = 'File Outline:\n';
    symbols.forEach(symbol => {
      fullOutline += buildOutline(symbol);
    });

    // For LLM-friendly output, convert to JSON
    const jsonOutline = JSON.stringify(symbols, null, 2); // Includes name, kind, range, etc.

    // Output options: Log to console, show in message, or write to file
    console.log(fullOutline); // View in VSCode Output panel (Ctrl+Shift+U > select your extension)
    vscode.window.showInformationMessage('Outline printed to console. Check Output panel.');
    
    // Optional: Copy to clipboard for LLM use
    await vscode.env.clipboard.writeText(jsonOutline);
    vscode.window.showInformationMessage('JSON outline copied to clipboard for LLM summarization.');

    // Optional: Write to a file next to the original (e.g., filename_outline.txt)
    const outlineUri = uri.with({ path: uri.path.replace(/\.py$/, '_outline.txt') });
    await vscode.workspace.fs.writeFile(outlineUri, Buffer.from(fullOutline, 'utf8'));
    vscode.window.showInformationMessage(`Outline saved to ${outlineUri.fsPath}`);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}