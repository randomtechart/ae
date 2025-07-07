// Unused Footage Manager for After Effects
// This script finds unused footage items and provides a management interface

function main() {
// Check if a project is open
if (!app.project) {
alert(“Please open a project first.”);
return;
}

```
// Find unused footage items
var unusedItems = findUnusedFootage();

if (unusedItems.length === 0) {
    alert("No unused footage found in the project.");
    return;
}

// Create and show the management interface
createManagementUI(unusedItems);
```

}

function findUnusedFootage() {
var unusedItems = [];
var project = app.project;

```
// Iterate through all items in the project
for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);
    
    // Check if item is footage (not a composition or folder)
    if (item instanceof FootageItem) {
        // Check if the item is used in any composition
        if (item.usedIn.length === 0) {
            // Item is not used anywhere, add to unused array
            unusedItems.push({
                item: item,
                name: item.name,
                path: item.file ? item.file.fsName : "Missing File",
                size: item.file && item.file.exists ? getFileSize(item.file) : "Unknown"
            });
        }
    }
}

return unusedItems;
```

}

function getFileSize(file) {
try {
if (file.exists) {
var sizeBytes = file.length;
if (sizeBytes < 1024) return sizeBytes + “ B”;
if (sizeBytes < 1024 * 1024) return Math.round(sizeBytes / 1024 * 100) / 100 + “ KB”;
if (sizeBytes < 1024 * 1024 * 1024) return Math.round(sizeBytes / (1024 * 1024) * 100) / 100 + “ MB”;
return Math.round(sizeBytes / (1024 * 1024 * 1024) * 100) / 100 + “ GB”;
}
} catch (e) {
return “Unknown”;
}
return “Unknown”;
}

function createManagementUI(unusedItems) {
var dialog = new Window(“dialog”, “Unused Footage Manager”);
dialog.orientation = “column”;
dialog.alignChildren = “fill”;
dialog.spacing = 10;
dialog.margins = 16;

```
// Header
var headerPanel = dialog.add("panel", undefined, "Found " + unusedItems.length + " unused footage item(s)");
headerPanel.alignment = "fill";
headerPanel.margins = 10;

var headerText = headerPanel.add("statictext", undefined, "Select items to remove from project or delete from disk:");
headerText.alignment = "left";

// Main content area
var mainGroup = dialog.add("group");
mainGroup.orientation = "column";
mainGroup.alignChildren = "fill";
mainGroup.spacing = 5;

// Scrollable list
var listPanel = mainGroup.add("panel", undefined, "Unused Footage Items");
listPanel.alignment = "fill";
listPanel.preferredSize.width = 800;
listPanel.preferredSize.height = 400;
listPanel.margins = 5;

var listBox = listPanel.add("listbox", undefined, [], {multiselect: true});
listBox.alignment = "fill";
listBox.preferredSize.height = 350;

// Populate the list
for (var i = 0; i < unusedItems.length; i++) {
    var item = unusedItems[i];
    var displayText = item.name + " | " + item.size + " | " + item.path;
    var listItem = listBox.add("item", displayText);
    listItem.userData = item;
}

// Selection info
var infoGroup = mainGroup.add("group");
infoGroup.alignment = "fill";

var selectAllBtn = infoGroup.add("button", undefined, "Select All");
var deselectAllBtn = infoGroup.add("button", undefined, "Deselect All");
var selectedCountText = infoGroup.add("statictext", undefined, "Selected: 0 items");
selectedCountText.alignment = "right";

// Action buttons
var buttonGroup = dialog.add("group");
buttonGroup.alignment = "center";
buttonGroup.spacing = 10;

var removeBtn = buttonGroup.add("button", undefined, "Remove from Project");
var deleteBtn = buttonGroup.add("button", undefined, "Delete Files from Disk");
var cancelBtn = buttonGroup.add("button", undefined, "Cancel");

// Event handlers
selectAllBtn.onClick = function() {
    for (var i = 0; i < listBox.items.length; i++) {
        listBox.items[i].selected = true;
    }
    updateSelectedCount();
};

deselectAllBtn.onClick = function() {
    for (var i = 0; i < listBox.items.length; i++) {
        listBox.items[i].selected = false;
    }
    updateSelectedCount();
};

listBox.onSelectionChanged = function() {
    updateSelectedCount();
};

function updateSelectedCount() {
    var count = 0;
    for (var i = 0; i < listBox.items.length; i++) {
        if (listBox.items[i].selected) count++;
    }
    selectedCountText.text = "Selected: " + count + " items";
    removeBtn.enabled = count > 0;
    deleteBtn.enabled = count > 0;
}

removeBtn.onClick = function() {
    var selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
        alert("Please select items to remove.");
        return;
    }
    
    var result = confirm("Remove " + selectedItems.length + " item(s) from the project?");
    if (result) {
        removeFromProject(selectedItems);
        dialog.close();
    }
};

deleteBtn.onClick = function() {
    var selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
        alert("Please select items to delete.");
        return;
    }
    
    var result = confirm("WARNING: This will permanently delete " + selectedItems.length + " file(s) from your computer. This action cannot be undone!\n\nAre you sure you want to continue?");
    if (result) {
        deleteFiles(selectedItems);
        dialog.close();
    }
};

cancelBtn.onClick = function() {
    dialog.close();
};

function getSelectedItems() {
    var selected = [];
    for (var i = 0; i < listBox.items.length; i++) {
        if (listBox.items[i].selected) {
            selected.push(listBox.items[i].userData);
        }
    }
    return selected;
}

// Initialize
updateSelectedCount();

// Show dialog
dialog.show();
```

}

function removeFromProject(items) {
app.beginUndoGroup(“Remove Unused Footage”);

```
var removedCount = 0;
var errorCount = 0;

for (var i = 0; i < items.length; i++) {
    try {
        items[i].item.remove();
        removedCount++;
    } catch (e) {
        errorCount++;
    }
}

app.endUndoGroup();

var message = "Removed " + removedCount + " item(s) from project.";
if (errorCount > 0) {
    message += "\n" + errorCount + " item(s) could not be removed.";
}

alert(message);
```

}

function deleteFiles(items) {
app.beginUndoGroup(“Delete Unused Footage Files”);

```
var deletedCount = 0;
var removedCount = 0;
var errorCount = 0;
var missingCount = 0;

for (var i = 0; i < items.length; i++) {
    try {
        var file = items[i].item.file;
        
        if (file && file.exists) {
            // Try to delete the file
            if (file.remove()) {
                deletedCount++;
            } else {
                errorCount++;
            }
        } else {
            missingCount++;
        }
        
        // Remove from project regardless
        items[i].item.remove();
        removedCount++;
        
    } catch (e) {
        errorCount++;
    }
}

app.endUndoGroup();

var message = "Results:\n";
message += "- Files deleted: " + deletedCount + "\n";
message += "- Items removed from project: " + removedCount + "\n";

if (missingCount > 0) {
    message += "- Missing files (already deleted): " + missingCount + "\n";
}

if (errorCount > 0) {
    message += "- Errors encountered: " + errorCount + "\n";
}

alert(message);
```

}

// Run the script
main();