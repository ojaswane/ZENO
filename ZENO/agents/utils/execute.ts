const { exec } = require("child_process");

const commands: Record<string, string> = {
    chrome: "start chrome",
    arc: "start arc",
    vscode: "code",
    spotify: "start https://open.spotify.com/"
};

function executeCommand(data: any) {
    if (!data || !data.action) {
        console.log("Invalid command");
        return { success: false, message: "Invalid command payload" };
    }

    switch (data.action) {
        case "open_app":
            return openApp(data.app_name);

        case "search":
            return searchWeb(data.query);

        case "assistant_message":
            console.log("Assistant:", data.text);
            return { success: true, message: data.text || "Assistant responded" };

        default:
            console.log("Unknown action:", data.action);
            return { success: false, message: `Unknown action: ${data.action}` };
    }
}

function openApp(appName: string) {
    if (!appName) {
        console.log("Unable to recognize app name");
        return { success: false, message: "Unable to recognize app name" };
    }

    const command = commands[appName.toLowerCase()];
    if (!command) {
        console.log("App not supported:", appName);
        return { success: false, message: `App not supported: ${appName}` };
    }

    exec(command, (error: any, stdout: any, stderr: any) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error output: ${stderr}`);
            return;
        }
        console.log(`Command output: ${stdout}`);
    });

    return { success: true, message: `Opening ${appName}` };
}

function searchWeb(query: string) {
    if (!query) {
        console.log("Unable to recognize search query");
        return { success: false, message: "Unable to recognize search query" };
    }

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    console.log("Opening browser with search query:", query);
    exec(`start ${url}`);
    return { success: true, message: `Searching for ${query}` };
}

export default executeCommand;
