// Project Item Renamer v1.0
// A comprehensive tool for renaming items in After Effects project panel

(function createProjectRenamerUI() {
    
    // Check if After Effects is available
    if (typeof app === "undefined") {
        alert("This script must be run in After Effects.");
        return;
    }
    
    // Global variables
    var scriptName = "Project Item Renamer";
    var win, selectedItems = [];
    var undoGroupName = "Rename Project Items";
    
    // Utility functions
    function getSelectedItems() {
        var items = [];
        var project = app.project;
        
        if (!project) {
            return items;
        }
        
        // Get selected items from project panel
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (item && item.selected) {
                items.push(item);
            }
        }
        
        return items;
    }
    
    function validateInput(text, allowEmpty) {
        if (!allowEmpty && (!text || text.length === 0)) {
            return false;
        }
        return true;
    }
    
    function sanitizeName(name) {
        // Remove invalid characters for After Effects item names
        return name //name.replace(/[<>:"/\\|?*]/g, "_");
    }
    
    function showError(message) {
        alert("Error: " + message);
    }
    
    function showSuccess(message) {
        alert("Success: " + message);
    }
    
    // Rename operations
    function findAndReplace() {
        try {
            var findText = win.findReplaceGroup.findGroup.findInput.text;
            var replaceText = win.findReplaceGroup.replaceGroup.replaceInput.text;
            var useRegex = win.findReplaceGroup.optionsGroup.regexCheck.value;
            var caseSensitive = win.findReplaceGroup.optionsGroup.caseCheck.value;
            
            if (!validateInput(findText, false)) {
                showError("Find text cannot be empty.");
                return;
            }
            
            selectedItems = getSelectedItems();
            if (selectedItems.length === 0) {
                showError("No items selected in project panel.");
                return;
            }
            
            app.beginUndoGroup(undoGroupName);
            
            var changedCount = 0;
            
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                var oldName = item.name;
                var newName;
                
                if (useRegex) {
                    try {
                        var flags = caseSensitive ? "g" : "gi";
                        var regex = new RegExp(findText, flags);
                        newName = oldName.replace(regex, replaceText);
                    } catch (e) {
                        showError("Invalid regular expression: " + findText);
                        app.endUndoGroup();
                        return;
                    }
                } else {
                    if (caseSensitive) {
                        newName = oldName.split(findText).join(replaceText);
                    } else {
                        var regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                        newName = oldName.replace(regex, replaceText);
                    }
                }
                
                newName = sanitizeName(newName);
                
                if (newName !== oldName) {
                    item.name = newName;
                    changedCount++;
                }
            }
            
            app.endUndoGroup();
            
            if (changedCount > 0) {
                showSuccess("Renamed " + changedCount + " items.");
            } else {
                alert("No items were changed.");
            }
            
        } catch (e) {
            app.endUndoGroup();
            showError("Find and replace failed: " + e.toString());
        }
    }
    
    function addPrefix() {
        try {
            var prefix = win.prefixSuffixGroup.prefixGroup.prefixInput.text;
            
            if (!validateInput(prefix, false)) {
                showError("Prefix text cannot be empty.");
                return;
            }
            
            selectedItems = getSelectedItems();
            if (selectedItems.length === 0) {
                showError("No items selected in project panel.");
                return;
            }
            
            app.beginUndoGroup(undoGroupName);
            
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                item.name = sanitizeName(prefix + item.name);
            }
            
            app.endUndoGroup();
            showSuccess("Added prefix to " + selectedItems.length + " items.");
            
        } catch (e) {
            app.endUndoGroup();
            showError("Add prefix failed: " + e.toString());
        }
    }
    
    function addSuffix() {
        try {
            var suffix = win.prefixSuffixGroup.suffixGroup.suffixInput.text;
            
            if (!validateInput(suffix, false)) {
                showError("Suffix text cannot be empty.");
                return;
            }
            
            selectedItems = getSelectedItems();
            if (selectedItems.length === 0) {
                showError("No items selected in project panel.");
                return;
            }
            
            app.beginUndoGroup(undoGroupName);
            
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                item.name = sanitizeName(item.name + suffix);
            }
            
            app.endUndoGroup();
            showSuccess("Added suffix to " + selectedItems.length + " items.");
            
        } catch (e) {
            app.endUndoGroup();
            showError("Add suffix failed: " + e.toString());
        }
    }
    
    function addNumberSequence() {
        try {
            var baseName = win.numberingGroup.baseGroup.baseInput.text;
            var delimiter = win.numberingGroup.delimiterGroup.delimiterInput.text;
            var startNum = parseInt(win.numberingGroup.startGroup.startInput.text);
            var padding = parseInt(win.numberingGroup.paddingGroup.paddingInput.text);
            var useBaseName = win.numberingGroup.baseGroup.useBaseCheck.value;
            
            if (isNaN(startNum)) {
                showError("Start number must be a valid integer.");
                return;
            }
            
            if (isNaN(padding) || padding < 0) {
                showError("Padding must be a non-negative integer.");
                return;
            }
            
            if (useBaseName && !validateInput(baseName, false)) {
                showError("Base name cannot be empty when 'Use base name' is checked.");
                return;
            }
            
            selectedItems = getSelectedItems();
            if (selectedItems.length === 0) {
                showError("No items selected in project panel.");
                return;
            }
            
            app.beginUndoGroup(undoGroupName);
            
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                var currentNum = startNum + i;
                var paddedNum = currentNum.toString();
                
                // Add padding
                while (paddedNum.length < padding) {
                    paddedNum = "0" + paddedNum;
                }
                
                var newName;
                if (useBaseName) {
                    newName = baseName + delimiter + paddedNum;
                } else {
                    newName = item.name + delimiter + paddedNum;
                }
                
                item.name = sanitizeName(newName);
            }
            
            app.endUndoGroup();
            showSuccess("Added number sequence to " + selectedItems.length + " items.");
            
        } catch (e) {
            app.endUndoGroup();
            showError("Add number sequence failed: " + e.toString());
        }
    }
    
    function refreshSelection() {
        selectedItems = getSelectedItems();
        win.infoGroup.selectionText.text = "Selected: " + selectedItems.length + " items";
    }
    
    // UI Creation
    function createUI() {
        win = new Window("dialog", scriptName);
        win.orientation = "column";
        win.alignChildren = "fill";
        win.spacing = 10;
        win.margins = 16;
        
        // Header info
        win.infoGroup = win.add("group");
        win.infoGroup.orientation = "row";
        win.infoGroup.alignChildren = "center";
        
        win.infoGroup.selectionText = win.infoGroup.add("statictext", undefined, "Selected: 0 items");
        win.infoGroup.selectionText.alignment = "left";
        
        win.infoGroup.refreshBtn = win.infoGroup.add("button", undefined, "Refresh");
        win.infoGroup.refreshBtn.alignment = "right";
        win.infoGroup.refreshBtn.onClick = refreshSelection;
        
        // Find and Replace Panel
        win.findReplaceGroup = win.add("panel", undefined, "Find and Replace");
        win.findReplaceGroup.orientation = "column";
        win.findReplaceGroup.alignChildren = "fill";
        win.findReplaceGroup.margins = 10;
        
        win.findReplaceGroup.findGroup = win.findReplaceGroup.add("group");
        win.findReplaceGroup.findGroup.add("statictext", undefined, "Find:");
        win.findReplaceGroup.findGroup.findInput = win.findReplaceGroup.findGroup.add("edittext");
        win.findReplaceGroup.findGroup.findInput.preferredSize.width = 250;
        
        win.findReplaceGroup.replaceGroup = win.findReplaceGroup.add("group");
        win.findReplaceGroup.replaceGroup.add("statictext", undefined, "Replace:");
        win.findReplaceGroup.replaceGroup.replaceInput = win.findReplaceGroup.replaceGroup.add("edittext");
        win.findReplaceGroup.replaceGroup.replaceInput.preferredSize.width = 250;
        
        win.findReplaceGroup.optionsGroup = win.findReplaceGroup.add("group");
        win.findReplaceGroup.optionsGroup.regexCheck = win.findReplaceGroup.optionsGroup.add("checkbox", undefined, "Use RegEx");
        win.findReplaceGroup.optionsGroup.caseCheck = win.findReplaceGroup.optionsGroup.add("checkbox", undefined, "Case Sensitive");
        
        win.findReplaceGroup.executeBtn = win.findReplaceGroup.add("button", undefined, "Find and Replace");
        win.findReplaceGroup.executeBtn.onClick = findAndReplace;
        
        // Prefix/Suffix Panel
        win.prefixSuffixGroup = win.add("panel", undefined, "Prefix / Suffix");
        win.prefixSuffixGroup.orientation = "column";
        win.prefixSuffixGroup.alignChildren = "fill";
        win.prefixSuffixGroup.margins = 10;
        
        win.prefixSuffixGroup.prefixGroup = win.prefixSuffixGroup.add("group");
        win.prefixSuffixGroup.prefixGroup.add("statictext", undefined, "Prefix:");
        win.prefixSuffixGroup.prefixGroup.prefixInput = win.prefixSuffixGroup.prefixGroup.add("edittext");
        win.prefixSuffixGroup.prefixGroup.prefixInput.preferredSize.width = 150;
        win.prefixSuffixGroup.prefixGroup.prefixBtn = win.prefixSuffixGroup.prefixGroup.add("button", undefined, "Add Prefix");
        win.prefixSuffixGroup.prefixGroup.prefixBtn.onClick = addPrefix;
        
        win.prefixSuffixGroup.suffixGroup = win.prefixSuffixGroup.add("group");
        win.prefixSuffixGroup.suffixGroup.add("statictext", undefined, "Suffix:");
        win.prefixSuffixGroup.suffixGroup.suffixInput = win.prefixSuffixGroup.suffixGroup.add("edittext");
        win.prefixSuffixGroup.suffixGroup.suffixInput.preferredSize.width = 150;
        win.prefixSuffixGroup.suffixGroup.suffixBtn = win.prefixSuffixGroup.suffixGroup.add("button", undefined, "Add Suffix");
        win.prefixSuffixGroup.suffixGroup.suffixBtn.onClick = addSuffix;
        
        // Numbering Panel
        win.numberingGroup = win.add("panel", undefined, "Number Sequence");
        win.numberingGroup.orientation = "column";
        win.numberingGroup.alignChildren = "fill";
        win.numberingGroup.margins = 10;
        
        win.numberingGroup.baseGroup = win.numberingGroup.add("group");
        win.numberingGroup.baseGroup.useBaseCheck = win.numberingGroup.baseGroup.add("checkbox", undefined, "Use base name:");
        win.numberingGroup.baseGroup.baseInput = win.numberingGroup.baseGroup.add("edittext");
        win.numberingGroup.baseGroup.baseInput.preferredSize.width = 150;
        win.numberingGroup.baseGroup.baseInput.enabled = false;
        
        win.numberingGroup.baseGroup.useBaseCheck.onClick = function() {
            win.numberingGroup.baseGroup.baseInput.enabled = this.value;
        };
        
        win.numberingGroup.delimiterGroup = win.numberingGroup.add("group");
        win.numberingGroup.delimiterGroup.add("statictext", undefined, "Delimiter:");
        win.numberingGroup.delimiterGroup.delimiterInput = win.numberingGroup.delimiterGroup.add("edittext", undefined, "_");
        win.numberingGroup.delimiterGroup.delimiterInput.preferredSize.width = 50;
        
        win.numberingGroup.startGroup = win.numberingGroup.add("group");
        win.numberingGroup.startGroup.add("statictext", undefined, "Start number:");
        win.numberingGroup.startGroup.startInput = win.numberingGroup.startGroup.add("edittext", undefined, "1");
        win.numberingGroup.startGroup.startInput.preferredSize.width = 50;
        
        win.numberingGroup.paddingGroup = win.numberingGroup.add("group");
        win.numberingGroup.paddingGroup.add("statictext", undefined, "Zero padding:");
        win.numberingGroup.paddingGroup.paddingInput = win.numberingGroup.paddingGroup.add("edittext", undefined, "2");
        win.numberingGroup.paddingGroup.paddingInput.preferredSize.width = 50;
        
        win.numberingGroup.executeBtn = win.numberingGroup.add("button", undefined, "Add Number Sequence");
        win.numberingGroup.executeBtn.onClick = addNumberSequence;
        
        // Bottom buttons
        win.buttonGroup = win.add("group");
        win.buttonGroup.alignment = "center";
        
        win.buttonGroup.undoBtn = win.buttonGroup.add("button", undefined, "Undo Last Action");
        win.buttonGroup.undoBtn.onClick = function() {
            try {
                app.executeCommand(16); // Undo command ID
            } catch (e) {
                showError("Cannot undo: " + e.toString());
            }
        };
        
        win.buttonGroup.closeBtn = win.buttonGroup.add("button", undefined, "Close");
        win.buttonGroup.closeBtn.onClick = function() {
            win.close();
        };
        
        // Initial refresh
        refreshSelection();
        
        return win;
    }
    
    // Initialize and show UI
    try {
        createUI();
        win.show();
    } catch (e) {
        alert("Failed to create UI: " + e.toString());
    }
    
})();