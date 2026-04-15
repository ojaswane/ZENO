// This is the main file which actually runs the commnd
const { exec } = require("child_process");

const commands: Record<string, string> = {
    chrome: "start chrome",
    arc: "start arc",
    vscode: "code",
    spotify: "start https://open.spotify.com/"
};

function executecommand(data: any) {
    if (!data || !data.action) {
        console.log("Invalid command");
        return;
    }
    switch (data.action) {
        case "open_app":
            openApp(data.app_name);
            break;

        case "search":
            searchWeb(data.query);
            break;

        default:
            console.log("Unknown action:", data.action);
    }
}

function openApp(appName: string) {
    if (!appName) {
        console.log("Unable to recognize app name");
        return
    }

    let command = commands[appName.toLowerCase()];
    if (!command) {
        console.log("App not supported:", appName);
        return;
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

}

function searchWeb(query: string) {

}