import * as vscode from 'vscode';
import { ParquetData, readParquetFile } from './parquetReader';
/**
 * Define the document (the data model) used for parquet files.
 */
class ParquetDocument implements vscode.CustomDocument {
  static async create(
    uri: vscode.Uri,
    backupId: string | undefined
  ): Promise<ParquetDocument> {
    // If we have a backup, read that. Otherwise read the resource from the workspace
    const dataFile =
      typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
    const fileData = await ParquetDocument.readFile(dataFile);
    return new ParquetDocument(uri, fileData);
  }

  private static async readFile(uri: vscode.Uri): Promise<ParquetData> {
    const res = await readParquetFile(uri.path);
    return res;
    // if (uri.scheme === 'untitled') {
    // 	return new Uint8Array();
    // }
    // // TODO: use parquet reader
    // return new Uint8Array(await vscode.workspace.fs.readFile(uri));
  }

  private readonly _uri: vscode.Uri;

  private _documentData: ParquetData;

  private constructor(uri: vscode.Uri, initialContent: ParquetData) {
    this._uri = uri;
    this._documentData = initialContent;
  }

  public get uri() {
    return this._uri;
  }

  public get documentData(): ParquetData {
    return this._documentData;
  }

  dispose(): void {}
}

/**
 * Provider for parquet editors.
 *
 * Parquet editors are used for `.parquet` files, which are binary files with a different file extension.
 */
export class ParquetEditorProvider
  implements vscode.CustomEditorProvider<ParquetDocument>
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      ParquetEditorProvider.viewType,
      new ParquetEditorProvider(context),
      {
        // For this demo extension, we enable `retainContextWhenHidden` which keeps the
        // webview alive even when it is not visible. You should avoid using this setting
        // unless is absolutely required as it does have memory overhead.
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
  }

  private static readonly viewType = 'parquetViewer.view';

  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string }
  ): Promise<ParquetDocument> {
    const document: ParquetDocument = await ParquetDocument.create(
      uri,
      openContext.backupId
    );
    return document;
  }

  async resolveCustomEditor(
    document: ParquetDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true
    };
    webviewPanel.webview.html = this.getHtmlForWebview(
      document,
      webviewPanel.webview
    );
  }

  /**
   * Get the static HTML used for in our editor's webviews.
   */
  private getHtmlForWebview(
    doc: ParquetDocument,
    webview: vscode.Webview
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'src', 'sort.js')
    );
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
        this._context.extensionUri, 'src', 'styles.css'));
    const nonce = this.getNonce();
    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleMainUri}" rel="stylesheet" />
				<title>Parquet Viewer</title>
			</head>
			<body>
                <table id="parquetDataTable">
                    <thead>
                        <tr>
                            <th></th>
                            ${doc.documentData?.columnNames
                              ?.map(
                                (cn, idx) =>
                                  `<th id="th-${idx}">${cn.name} <span class="data-type">(${cn.type})</span></th>`
                              )
                              .join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${doc.documentData?.rows
                          .map(
                            (row, idx) =>
                              `<tr><td class="dimmed">${idx}</td>${doc.documentData.columnNames
                                .map((cn) => `<td class="${row[cn.name] === undefined ? "dimmed" : ""}">${row[cn.name]}</td>`)
                                .join('')}</tr>`
                          )
                          .join('')}
                    </tbody>
                </table>
                <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private getNonce() {
    let text = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /* #region Unused, maybe will be needed in the future */
  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<ParquetDocument>
  >();
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;
  saveCustomDocument(
    document: ParquetDocument,
    cancellation: vscode.CancellationToken
  ): Thenable<void> {
    return Promise.resolve();
  }
  saveCustomDocumentAs(
    document: ParquetDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken
  ): Thenable<void> {
    return Promise.resolve();
  }
  revertCustomDocument(
    document: ParquetDocument,
    cancellation: vscode.CancellationToken
  ): Thenable<void> {
    return Promise.resolve();
  }
  backupCustomDocument(
    document: ParquetDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken
  ): Thenable<vscode.CustomDocumentBackup> {
    throw new Error('Method not implemented.');
  }
  /* #endregion */
}
