/*
Duplicate Footage Consolidator Script for After Effects
This script finds and consolidates duplicate footage items in the project
*/

(function duplicateFootageConsolidator() {


// Undo group for the entire operation
app.beginUndoGroup("Consolidate Duplicate Footage");

try {
    var project = app.project;
    if (!project) {
        alert("No project is open.");
        return;
    }
    
    var footageItems = [];
    var duplicatesFound = 0;
    var duplicatesReplaced = 0;
    
    // Collect all footage items
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof FootageItem) {
            footageItems.push(item);
        }
    }
    
    if (footageItems.length === 0) {
        alert("No footage items found in project.");
        return;
    }
    
    // Create a map to track unique footage
    var uniqueFootage = {};
    var duplicateMap = {}; // Maps duplicate items to their master item
    
    // Process each footage item
    for (var i = 0; i < footageItems.length; i++) {
        var currentItem = footageItems[i];
        var footageKey = createFootageKey(currentItem);
        
        if (footageKey) {
            if (uniqueFootage[footageKey]) {
                // This is a duplicate
                duplicateMap[currentItem.id] = uniqueFootage[footageKey];
                duplicatesFound++;
            } else {
                // This is the first occurrence
                uniqueFootage[footageKey] = currentItem;
            }
        }
    }
    
    if (duplicatesFound === 0) {
        alert("No duplicate footage found in project.");
        return;
    }
    
    // Replace duplicates in all compositions
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            replaceDuplicatesInComp(item, duplicateMap);
        }
    }
    
    // Remove duplicate footage items
    var itemsToRemove = [];
    for (var duplicateId in duplicateMap) {
        var duplicateItem = findItemById(parseInt(duplicateId));
        if (duplicateItem && duplicateItem.numUsedIn === 0) {
            itemsToRemove.push(duplicateItem);
            duplicatesReplaced++;
        }
    }
    
    // Remove unused duplicate items
    for (var i = 0; i < itemsToRemove.length; i++) {
        itemsToRemove[i].remove();
    }
    
    alert("Duplicate footage consolidation complete!\n" +
          "Duplicates found: " + duplicatesFound + "\n" +
          "Duplicates removed: " + duplicatesReplaced);
          
} catch (error) {
    alert("Error: " + error.toString());
} finally {
    app.endUndoGroup();
}

// Helper function to create a unique key for footage comparison
function createFootageKey(footageItem) {
    try {
        var key = "";
        
        if (footageItem.mainSource instanceof FileSource) {
            var fileSource = footageItem.mainSource;
            key += fileSource.file.fsName; // Full file path
            
            // Add relevant import settings
            if (footageItem.mainSource instanceof SolidSource) {
                var solidSource = footageItem.mainSource;
                key += "_solid_" + solidSource.color[0] + "_" + solidSource.color[1] + "_" + solidSource.color[2];
            } else {
                // For image sequences and video files
                key += "_" + footageItem.width + "x" + footageItem.height;
                key += "_" + footageItem.duration;
                key += "_" + footageItem.frameRate;
                
                // Include interpretation settings
                key += "_alpha_" + footageItem.mainSource.alphaMode;
                key += "_pulldown_" + footageItem.mainSource.removePulldown;
                key += "_conform_" + footageItem.mainSource.conformFrameRate;
                
                // For image sequences, include first and last frame
                if (footageItem.mainSource.isStill === false && fileSource.file.name.match(/\d+\./)) {
                    key += "_seq_" + footageItem.mainSource.missingFootagePath;
                }
            }
        } else if (footageItem.mainSource instanceof PlaceholderSource) {
            var placeholderSource = footageItem.mainSource;
            key += "placeholder_" + footageItem.name + "_" + footageItem.width + "x" + footageItem.height;
        }
        
        return key;
    } catch (e) {
        return null;
    }
}

// Helper function to replace duplicates in a composition
function replaceDuplicatesInComp(comp, duplicateMap) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        
        if (layer.source && duplicateMap[layer.source.id]) {
            var masterSource = duplicateMap[layer.source.id];
            layer.replaceSource(masterSource, false);
        }
        
        // Handle precomps recursively
        if (layer.source instanceof CompItem) {
            replaceDuplicatesInComp(layer.source, duplicateMap);
        }
    }
}

// Helper function to find item by ID
function findItemById(id) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item.id === id) {
            return item;
        }
    }
    return null;
}


})();