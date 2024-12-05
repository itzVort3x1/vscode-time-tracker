# Language Time Tracker

**Language Time Tracker** is a Visual Studio Code extension that tracks the time you spend typing in different programming languages. It helps you monitor your productivity and gain insights into your coding habits.

---

## Features

-   **Track Typing Time**:

    -   Automatically logs the time you spend typing in different files grouped by language.
    -   Time is saved persistently and grouped by date for easy reference.

-   **Tree View in Activity Bar**:

    -   View your typing time grouped by date and language in the **Activity Bar** under the "Language Time Tracker" icon.

-   **Status Bar Display**:

    -   Shows the current language and typing time in the **status bar**.

-   **Manage Time Records**:
    -   Clear or delete time records directly from the activity bar tree view.

---

## Installation

1. Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/).
2. Alternatively, you can download the `.vsix` file from the [Releases Page](https://github.com/your-repo/language-time-tracker/releases) and install it manually:
    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
    - Select `Install from VSIX`.
    - Choose the downloaded `.vsix` file.

---

## Usage

1. **Start Tracking**:

    - Open any file in Visual Studio Code and start typing. The extension automatically logs your typing time.

2. **View Time Records**:

    - Click the **Clock Icon** in the Activity Bar to open the "Languages and Time" tree view.
    - Expand dates to see time spent on each language.

3. **Manage Time Records**:

    - Right-click on a language in the tree view to **Clear Time** (reset to 0)

4. **Monitor in Status Bar**:
    - Check the status bar to see the current language and total typing time for the day.

---

## Commands

-   **Clear Time**:

    -   Resets the time logged for a specific language on a specific date.

---

## Settings

No configuration is required. All data is stored locally in a JSON file within the extension's storage directory.

---

## Development

### Prerequisites

-   **Node.js**: Ensure you have Node.js installed.
-   **VSCE**: Install the Visual Studio Code Extension Manager:
    ```bash
    npm install -g @vscode/vsce
    ```
