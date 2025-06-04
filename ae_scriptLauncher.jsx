// JSX Script Browser for After Effects
// Recursively scans folders for JSX files and displays them in a hierarchical tree

(function() {
// Main function to create the UI
function createScriptBrowser() {
// Create main window
var win = new Window(“dialog”, “JSX Script Browser”);
win.orientation = “column”;
win.alignChildren = “fill”;
win.preferredSize.width = 500;
win.preferredSize.height = 600;

```
    // Top panel for folder selection
    var topPanel = win.add("panel", undefined, "Select Folder");
    topPanel.orientation = "row";
    topPanel.alignChildren = "left";
    topPanel.margins = 10;
    
    var folderPath = topPanel.add("edittext", undefined, "");
    folderPath.preferredSize.width = 350;
    folderPath.enabled = false;
    
    var browseBtn = topPanel.add("button", undefined, "Browse...");
    var scanBtn = topPanel.add("button", undefined, "Scan");
    scanBtn.enabled = false;
    
    // Tree panel
    var treePanel = win.add("panel", undefined, "JSX Scripts");
    treePanel.orientation = "column";
    treePanel.alignChildren = "fill";
    treePanel.margins = 10;
    
    var tree = treePanel.add("treeview");
    tree.preferredSize.height = 400;
    
    // Button panel
    var btnPanel = win.add("group");
    btnPanel.orientation = "row";
    btnPanel.alignment = "center";
    
    var refreshBtn = btnPanel.add("button", undefined, "Refresh");
    var closeBtn = btnPanel.add("button", undefined, "Close");
    
    // Global variables
    var selectedFolder = null;
    var scriptData = {};
    
    // Helper function to get file extension
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
    
    // Helper function to get relative path
    function getRelativePath(fullPath, basePath) {
        var basePathStr = basePath.toString();
        var fullPathStr = fullPath.toString();
        
        if (fullPathStr.indexOf(basePathStr) === 0) {
            return fullPathStr.substring(basePathStr.length + 1);
        }
        return fullPathStr;
    }
    
    // Recursive function to scan folders
    function scanFolder(folder, basePath) {
        var results = {};
        
        if (!folder.exists) {
            return results;
        }
        
        var files = folder.getFiles();
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            if (file instanceof Folder) {
                // Recursively scan subfolders
                var subResults = scanFolder(file, basePath);
                var relativePath = getRelativePath(file.absoluteURI, basePath.absoluteURI);
                
                if (Object.keys(subResults).length > 0) {
                    results[relativePath] = subResults;
                }
            } else if (file instanceof File) {
                // Check if it's a JSX file
                if (getFileExtension(file.name) === 'jsx') {
                    if (!results['_files']) {
                        results['_files'] = [];
                    }
                    results['_files'].push({
                        name: file.name,
                        path: file.absoluteURI
                    });
                }
            }
        }
        
        return results;
    }
    
    // Function to populate tree from scan results
    function populateTree(data, parentNode, level) {
        level = level || 0;
        
        for (var key in data) {
            if (key === '_files') {
                // Add files to current level
                var files = data[key];
                for (var i = 0; i < files.length; i++) {
                    var fileItem = parentNode.add("item", files[i].name);
                    fileItem.scriptPath = files[i].path;
                    fileItem.isScript = true;
                }
            } else {
                // Add folder node
                var folderItem = parentNode.add("node", key);
                folderItem.expanded = level < 2; // Auto-expand first 2 levels
                
                // Recursively add contents
                populateTree(data[key], folderItem, level + 1);
            }
        }
    }
    
    // Function to execute JSX script
    function executeScript(scriptPath) {
        try {
            var scriptFile = new File(scriptPath);
            if (scriptFile.exists) {
                $.evalFile(scriptFile);
            } else {
                alert("Script file not found: " + scriptPath);
            }
        } catch (error) {
            alert("Error executing script: " + error.toString());
        }
    }
    
    // Event handlers
    browseBtn.onClick = function() {
        var folder = Folder.selectDialog("Select folder to scan for JSX scripts");
        if (folder) {
            selectedFolder = folder;
            folderPath.text = folder.absoluteURI;
            scanBtn.enabled = true;
        }
    };
    
    scanBtn.onClick = function() {
        if (!selectedFolder) {
            alert("Please select a folder first.");
            return;
        }
        
        // Clear existing tree
        tree.removeAll();
        
        // Show progress
        var progressWin = new Window("dialog", "Scanning...");
        progressWin.add("statictext", undefined, "Scanning for JSX files...");
        progressWin.show();
        
        try {
            // Scan the folder
            scriptData = scanFolder(selectedFolder, selectedFolder);
            
            // Populate tree
            populateTree(scriptData, tree);
            
            progressWin.close();
            
            if (tree.items.length === 0) {
                alert("No JSX files found in the selected folder.");
            }
        } catch (error) {
            progressWin.close();
            alert("Error scanning folder: " + error.toString());
        }
    };
    
    refreshBtn.onClick = function() {
        if (selectedFolder) {
            scanBtn.onClick();
        } else {
            alert("Please select a folder first.");
        }
    };
    
    // Double-click handler for tree items
    tree.onDoubleClick = function() {
        var selectedItem = tree.selection;
        if (selectedItem && selectedItem.isScript) {
            executeScript(selectedItem.scriptPath);
        }
    };
    
    closeBtn.onClick = function() {
        win.close();
    };
    
    // Show window
    win.center();
    win.show();
}

// Initialize the script browser
createScriptBrowser();
```

})();