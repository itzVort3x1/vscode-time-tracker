import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    // Path to save typing time data
    const timeLogPath = path.join(
        context.globalStorageUri.fsPath,
        "language-times.json"
    );
    if (!fs.existsSync(context.globalStorageUri.fsPath)) {
        fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
    }

    // Load previous times from the JSON file
    const languageTimes: { [date: string]: { [language: string]: number } } =
        fs.existsSync(timeLogPath)
            ? JSON.parse(fs.readFileSync(timeLogPath, "utf-8"))
            : {};

    const saveTimesToFile = () => {
        fs.writeFileSync(timeLogPath, JSON.stringify(languageTimes, null, 2));
    };

    let currentLanguage: string | null = null;
    let lastTypeTime: number | null = null;

    // Create a StatusBarItem to display the current language and typing time
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "Initializing...";
    statusBarItem.show();

    // Function to update the status bar with language and typing time
    const updateStatusBar = () => {
        if (currentLanguage) {
            const today = new Date().toISOString().split("T")[0];
            const timeSpent = languageTimes[today]?.[currentLanguage] || 0;
            statusBarItem.text = `$(file-code) Language: ${currentLanguage} | $(clock) Typing Time: ${formatTime(
                timeSpent
            )}`;
        } else {
            statusBarItem.text = `$(warning) No active editor | $(clock) Typing Time: 00:00:00`;
        }
    };

    // Tree View for Languages and Time grouped by Date
    const treeDataProvider = new LanguageTimeTrackerProvider(
        languageTimes,
        saveTimesToFile,
        updateStatusBar
    );
    const view = vscode.window.createTreeView("languagesList", {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true,
    });

    context.subscriptions.push(view);

    // Function to format time in hh:mm:ss format
    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Function to handle typing events
    const handleTypingEvent = () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const language = editor.document.languageId;
            const today = new Date().toISOString().split("T")[0];
            const now = Date.now();

            // Initialize date and language if not already present
            if (!languageTimes[today]) {
                languageTimes[today] = {};
            }

            if (!languageTimes[today][language]) {
                languageTimes[today][language] = 0;
            }

            // Update typing time for the current language
            if (currentLanguage === language && lastTypeTime) {
                const elapsedTime = now - lastTypeTime;
                languageTimes[today][language] += elapsedTime / 1000; // Convert to seconds
            }

            currentLanguage = language;
            lastTypeTime = now;

            // Save data to file and refresh views
            saveTimesToFile();
            updateStatusBar();
            treeDataProvider.refresh();
        }
    };

    // Event listener for typing
    vscode.workspace.onDidChangeTextDocument(
        handleTypingEvent,
        null,
        context.subscriptions
    );

    // Handle active editor changes
    vscode.window.onDidChangeActiveTextEditor(
        () => {
            lastTypeTime = Date.now();
            updateStatusBar();
            treeDataProvider.refresh();
        },
        null,
        context.subscriptions
    );

    // Register "Clear Time" command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.clearTime",
            (item: LanguageTimeItem) => {
                const idParts = item.id?.split("|");
                if (idParts && idParts.length === 2) {
                    const [date, language] = idParts;
                    if (languageTimes[date]?.[language]) {
                        languageTimes[date][language] = 0; // Reset time
                        saveTimesToFile();
                        treeDataProvider.refresh();
                        updateStatusBar();
                        vscode.window.showInformationMessage(
                            `Cleared time for ${language} on ${date}.`
                        );
                    }
                }
            }
        )
    );

    // Register "Delete Time" command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.deleteTime",
            (item: LanguageTimeItem) => {
                const idParts = item.id?.split("|");
                if (idParts && idParts.length === 2) {
                    const [date, language] = idParts;
                    if (languageTimes[date]?.[language]) {
                        delete languageTimes[date][language]; // Delete language entry
                        if (Object.keys(languageTimes[date]).length === 0) {
                            delete languageTimes[date]; // Remove date if empty
                        }
                        saveTimesToFile();
                        treeDataProvider.refresh();
                        updateStatusBar();
                        vscode.window.showInformationMessage(
                            `Deleted record for ${language} on ${date}.`
                        );
                    }
                }
            }
        )
    );

    // Initial update of the status bar
    updateStatusBar();
}

// Tree Data Provider for showing dates, languages, and their typing times
class LanguageTimeTrackerProvider
    implements vscode.TreeDataProvider<LanguageTimeItem>
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        LanguageTimeItem | undefined | null | void
    > = new vscode.EventEmitter<LanguageTimeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        LanguageTimeItem | undefined | null | void
    > = this._onDidChangeTreeData.event;

    constructor(
        private languageTimes: {
            [date: string]: { [language: string]: number };
        },
        private saveTimesToFile: () => void,
        private updateStatusBar: () => void
    ) {}

    getTreeItem(element: LanguageTimeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: LanguageTimeItem): Thenable<LanguageTimeItem[]> {
        if (!element) {
            // Return all dates as root items
            return Promise.resolve(
                Object.keys(this.languageTimes)
                    .filter(
                        (date) =>
                            Object.keys(this.languageTimes[date]).length > 0
                    ) // Only show dates with data
                    .map(
                        (date) =>
                            new LanguageTimeItem(
                                date,
                                vscode.TreeItemCollapsibleState.Collapsed,
                                undefined, // No id for date items
                                "dateTimeItem" // Context for date items
                            )
                    )
            );
        } else if (this.languageTimes[element.label]) {
            // Return languages and times for a specific date
            const date = element.label;
            const languages = this.languageTimes[date];
            return Promise.resolve(
                Object.entries(languages).map(([language, time]) => {
                    const id = `${date}|${language}`;
                    return new LanguageTimeItem(
                        `${language} - ${this.formatTime(time)}`,
                        vscode.TreeItemCollapsibleState.None,
                        id, // Unique ID for this language entry
                        "languageTimeItem" // Context for language-time entries
                    );
                })
            );
        }

        return Promise.resolve([]);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
        this.updateStatusBar(); // Update status bar when the tree is refreshed
    }

    // Format time in hh:mm:ss format
    private formatTime(seconds: number): string {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
}

// Tree Item for each date or language-time entry
class LanguageTimeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly id: string | undefined,
        public readonly contextValue: string // Context for enabling commands
    ) {
        super(label, collapsibleState);
        this.id = id;
        this.contextValue = contextValue;
    }
}

export function deactivate() {}
