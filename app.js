const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Google Drive API Setup
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), // Replace with your JSON string
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

// Recursive function to fetch files from Google Drive
async function getFileList(folderId) {
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
    });
    
    const files = res.data.files;
    let fileList = { files: [], folders: [] };

    for (let file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            // If it's a folder, add it to the folders array
            fileList.folders.push(file);
        } else {
            // Otherwise, it's a file, add it to the files array
            fileList.files.push(file);
        }
    }

    return fileList;
}

// Serve file list for a given folder
app.get('/', async (req, res) => {
    const folderId = req.query.folderId || process.env.FOLDER_ID; // Default folder if no query param

    try {
        const { files, folders } = await getFileList(folderId);
        res.render('index', { files, folders });
    } catch (err) {
        res.status(500).send('Error fetching file list');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
