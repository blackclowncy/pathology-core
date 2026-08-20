/**
 * =========================================================================
 * Tang Lab Pathology Core - Google Drive Auto-Backup & Sync Engine
 * =========================================================================
 * 
 * Instructions:
 * 1. Open https://script.google.com with your target Google Account.
 * 2. Click "+ New project".
 * 3. Delete any default code and paste this entire file content.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Click the gear icon (Select type) -> choose "Web app".
 * 6. Configuration:
 *    - Description: Tang Lab Pathology Backup Service
 *    - Execute as: Me (your_email@gmail.com)  <-- Ensures backups save to THIS account
 *    - Who has access: Anyone
 * 7. Click "Deploy" -> Review Permissions -> Choose your Google Account -> Allow.
 * 8. Copy the "Web app URL" and paste it into Pathology Core Settings (or Cloud Sync setup).
 * =========================================================================
 */

/**
 * First-time Setup:
 * Select "initialSetupAuth" from the function dropdown above and click "Run ▶" to grant Google Drive permission.
 */
function initialSetupAuth() {
  var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
  Logger.log('Google Drive permission authorized successfully! Target folder: ' + folder.getName());
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:24px;background:#0b1326;color:#dae2fd;border-radius:12px;max-width:600px;margin:40px auto;border:1px solid #334155;">' +
    '<h2 style="color:#4cd7f6;margin-top:0;">Tang Lab Pathology Core - Google Drive Sync Service</h2>' +
    '<p>Service Status: <strong style="color:#4edea3;">Active & Ready</strong></p>' +
    '<p>This Google Apps Script Web App securely receives automated Excel and JSON backups from your Pathology Core repository.</p>' +
    '<p style="font-size:12px;color:#94a3b8;">Target Folder: <code>Tang_Lab_Pathology_Backups</code> in your Google Drive.</p>' +
    '</div>'
  );
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var action = payload.action || 'backup';
    var userEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || 'Authenticated Google Account';

    // 1. Connection Ping Test
    if (action === 'ping') {
      var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
      return createJsonResponse({
        success: true,
        message: 'Google Drive connection established successfully!',
        account: userEmail,
        folderName: folder.getName(),
        folderUrl: folder.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Backup Action
    if (action === 'backup') {
      var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
      var timestampStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd_HH-mm');

      // Save / Overwrite Latest Excel (.xlsx)
      var excelFileUrl = '';
      if (payload.excelBase64) {
        var decodedExcel = Utilities.base64Decode(payload.excelBase64);
        var excelBlob = Utilities.newBlob(decodedExcel, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Tang_Lab_Specimens_Latest.xlsx');
        
        var existingExcelFiles = folder.getFilesByName('Tang_Lab_Specimens_Latest.xlsx');
        while (existingExcelFiles.hasNext()) {
          existingExcelFiles.next().setTrashed(true);
        }
        var newExcelFile = folder.createFile(excelBlob);
        excelFileUrl = newExcelFile.getUrl();

        // Save timestamped historical copy in Archive subfolder
        var archiveFolder = getOrCreateSubFolder(folder, 'Archive_History');
        var archiveBlob = Utilities.newBlob(decodedExcel, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Tang_Lab_Specimens_' + timestampStr + '.xlsx');
        archiveFolder.createFile(archiveBlob);
      }

      // Save / Overwrite Latest JSON Snapshot (.json)
      var jsonFileUrl = '';
      if (payload.jsonBackup) {
        var jsonBlob = Utilities.newBlob(payload.jsonBackup, 'application/json', 'Tang_Lab_Pathology_Backup_Latest.json');
        var existingJsonFiles = folder.getFilesByName('Tang_Lab_Pathology_Backup_Latest.json');
        while (existingJsonFiles.hasNext()) {
          existingJsonFiles.next().setTrashed(true);
        }
        var newJsonFile = folder.createFile(jsonBlob);
        jsonFileUrl = newJsonFile.getUrl();
      }

      return createJsonResponse({
        success: true,
        message: 'Successfully backed up to Google Drive!',
        account: userEmail,
        folderUrl: folder.getUrl(),
        excelUrl: excelFileUrl,
        jsonUrl: jsonFileUrl,
        specimenCount: payload.specimenCount || 0,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Restore Action
    if (action === 'restore') {
      var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
      var jsonFiles = folder.getFilesByName('Tang_Lab_Pathology_Backup_Latest.json');
      if (jsonFiles.hasNext()) {
        var file = jsonFiles.next();
        var content = file.getBlob().getDataAsString();
        var parsedData = JSON.parse(content);
        return createJsonResponse({
          success: true,
          message: 'Latest backup retrieved from Google Drive',
          data: parsedData,
          updatedAt: file.getLastUpdated().toISOString()
        });
      } else {
        return createJsonResponse({
          success: false,
          error: 'No backup file (Tang_Lab_Pathology_Backup_Latest.json) found in your Google Drive.'
        });
      }
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subFolderName);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
