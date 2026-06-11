import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    backgroundColor: '#060912',
    webPreferences: {
      contextIsolation: true
    }
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  win.loadFile(path.join(__dirname, '../../web/dist/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

