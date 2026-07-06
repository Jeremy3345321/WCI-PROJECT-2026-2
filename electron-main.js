const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let phpServer;

// Start PHP built-in server
function startPHPServer() {
    const phpPath = 'php'; // Assumes PHP is in system PATH
    const port = 8080;
    const documentRoot = __dirname;

    console.log('Starting PHP server...');
    console.log('Document root:', documentRoot);
    
    phpServer = spawn(phpPath, ['-S', `localhost:${port}`, '-t', documentRoot], {
        cwd: documentRoot
    });

    phpServer.stdout.on('data', (data) => {
        console.log(`PHP Server: ${data}`);
    });

    phpServer.stderr.on('data', (data) => {
        console.error(`PHP Server Error: ${data}`);
    });

    phpServer.on('close', (code) => {
        console.log(`PHP server exited with code ${code}`);
    });

    return `http://localhost:${port}`;
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        icon: path.join(__dirname, 'favicon_io', 'favicon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        backgroundColor: '#1a1d2e',
        show: false, // Don't show until ready
        title: 'Western Scheduling System'
    });

    // Start PHP server and load the app
    const serverUrl = startPHPServer();
    
    // Wait a bit for PHP server to start
    setTimeout(() => {
        mainWindow.loadURL(serverUrl);
    }, 1500);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Create application menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomLevel(0);
                    }
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Western Scheduling System',
                            message: 'Western Colleges Scheduling System',
                            detail: 'Version 1.0.0\n\nA comprehensive scheduling management system for Western Colleges High School Department.\n\n© 2024 Western Colleges, Inc.',
                            buttons: ['OK']
                        });
                    }
                },
                {
                    label: 'Check for Updates',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Updates',
                            message: 'You are using the latest version',
                            detail: 'Version 1.0.0',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App ready
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Clean up PHP server on quit
app.on('before-quit', () => {
    if (phpServer) {
        console.log('Stopping PHP server...');
        phpServer.kill();
    }
});

// Handle app quit
app.on('quit', () => {
    if (phpServer) {
        phpServer.kill();
    }
});
