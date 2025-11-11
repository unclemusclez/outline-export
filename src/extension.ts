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

    // Map for SymbolKind enum to readable strings
    const symbolKindMap: { [key: number]: string } = {
      0: 'File',
      1: 'Module',
      2: 'Namespace',
      3: 'Package',
      4: 'Class',
      5: 'Method',
      6: 'Property',
      7: 'Field',
      8: 'Constructor',
      9: 'Enum',
      10: 'Interface',
      11: 'Function',
      12: 'Variable',
      13: 'Constant',
      14: 'String',
      15: 'Number',
      16: 'Boolean',
      17: 'Array',
      18: 'Object',
      19: 'Key',
      20: 'Null',
      21: 'EnumMember',
      22: 'Struct',
      23: 'Event',
      24: 'Operator',
      25: 'TypeParameter',
    };

    // Recursively build a structured outline (e.g., as a tree)
    function buildOutline(symbol: vscode.DocumentSymbol, indent: string = ''): string {
      const kindString = symbolKindMap[symbol.kind] || 'Unknown';
      let outline = `${indent}- ${symbol.name} (${kindString}) [Lines ${symbol.range.start.line + 1}-${symbol.range.end.line + 1}]\n`;
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