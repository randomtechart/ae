// Compression Rate Marker Checker Script for After Effects
// This script recursively searches through compositions and checks for compression rate markers

(function() {
// Global variables
var layersWithoutMarkers = [];
var mainWindow;


// Main function to start the process
function main() {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }
    
    var activeComp = app.project.activeItem;
    layersWithoutMarkers = [];
    
    // Start recursive search
    searchCompositionRecursively(activeComp);
    
    // Create and show the UI window
    createUI();
}

// Check if layer is an image sequence or video
function isImageSequenceOrVideo(layer) {
    if (!layer.source || !(layer.source instanceof FootageItem)) {
        return false;
    }
    
    var footage = layer.source;
    // Check if it's a sequence/video (has duration > 0 and has video)
    return footage.duration > 0 && footage.hasVideo;
}

// Recursively search through compositions
function searchCompositionRecursively(comp) {
    // Check all layers in current composition
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        
        // Only process image sequence or video layers
        if (isImageSequenceOrVideo(layer)) {
            // Check if layer has compression rate marker
            if (!hasCompressionRateMarker(layer)) {
                layersWithoutMarkers.push({
                    layer: layer,
                    comp: comp,
                    layerName: layer.name,
                    compName: comp.name
                });
            }
        }
        
        // If layer is a composition layer, search recursively
        if (layer.source && layer.source instanceof CompItem) {
            searchCompositionRecursively(layer.source);
        }
    }
}

// Check if layer has compression rate marker
function hasCompressionRateMarker(layer) {
    try {
        var markerProperty = layer.property("Marker");
        if (markerProperty && markerProperty.numKeys > 0) {
            for (var i = 1; i <= markerProperty.numKeys; i++) {
                var marker = markerProperty.keyValue(i);
                if (marker.comment && marker.comment.toLowerCase().indexOf("compression rate") !== -1) {
                    return true;
                }
            }
        }
    } catch (e) {
        // Layer doesn't support markers
    }
    return false;
}

// Create the UI window
function createUI() {
    if (layersWithoutMarkers.length === 0) {
        alert("All layers already have compression rate markers!");
        return;
    }
    
    // Create main window
    mainWindow = new Window("dialog", "Compression Rate Marker Manager");
    mainWindow.orientation = "column";
    mainWindow.alignChildren = "fill";
    mainWindow.spacing = 10;
    mainWindow.margins = 16;
    
    // Add title
    var titleGroup = mainWindow.add("group");
    titleGroup.add("statictext", undefined, "Layers missing compression rate markers: " + layersWithoutMarkers.length);
    
    // Create scrollable panel
    var scrollPanel = mainWindow.add("panel");
    scrollPanel.text = "Layers";
    scrollPanel.orientation = "column";
    scrollPanel.alignChildren = "fill";
    scrollPanel.preferredSize.width = 600;
    scrollPanel.preferredSize.height = 400;
    
    // Create list group with scrollbar
    var listGroup = scrollPanel.add("group");
    listGroup.orientation = "column";
    listGroup.alignChildren = "fill";
    listGroup.spacing = 5;
    
    // Add layers to the list
    for (var i = 0; i < layersWithoutMarkers.length; i++) {
        createLayerRow(listGroup, layersWithoutMarkers[i], i);
    }
    
    // Add buttons at bottom
    var buttonGroup = mainWindow.add("group");
    buttonGroup.alignment = "center";
    
    var closeButton = buttonGroup.add("button", undefined, "Close");
    closeButton.onClick = function() {
        mainWindow.close();
    };
    
    // Show window
    mainWindow.show();
}

// Create a row for each layer
function createLayerRow(parent, layerInfo, index) {
    var rowGroup = parent.add("panel");
    rowGroup.orientation = "row";
    rowGroup.alignChildren = "top";
    rowGroup.spacing = 10;
    rowGroup.margins = 10;
    
    // Layer info column
    var infoGroup = rowGroup.add("group");
    infoGroup.orientation = "column";
    infoGroup.alignChildren = "left";
    infoGroup.spacing = 3;
    
    infoGroup.add("statictext", undefined, "Layer: " + layerInfo.layerName);
    infoGroup.add("statictext", undefined, "Comp: " + layerInfo.compName);
    
    // Compression rate input
    var inputGroup = rowGroup.add("group");
    inputGroup.orientation = "row";
    inputGroup.spacing = 5;
    
    inputGroup.add("statictext", undefined, "Compression Rate:");
    var compressionInput = inputGroup.add("edittext", undefined, "100");
    compressionInput.characters = 10;
    compressionInput.helpTip = "Enter compression rate value";
    
    // Buttons column
    var buttonGroup = rowGroup.add("group");
    buttonGroup.orientation = "column";
    buttonGroup.spacing = 5;
    
    var fixButton = buttonGroup.add("button", undefined, "Fix It");
    var selectButton = buttonGroup.add("button", undefined, "Select");
    
    // Fix button functionality
    fixButton.onClick = function() {
        try {
            var compressionRate = compressionInput.text || "100";
            addCompressionRateMarker(layerInfo.layer, compressionRate);
            fixButton.enabled = false;
            fixButton.text = "Fixed";
            alert("Compression rate marker added successfully!");
        } catch (e) {
            alert("Error adding marker: " + e.toString());
        }
    };
    
    // Select button functionality
    selectButton.onClick = function() {
        try {
            // Set the composition as active
            app.project.activeItem = layerInfo.comp;
            
            // Deselect all layers first
            for (var j = 1; j <= layerInfo.comp.numLayers; j++) {
                layerInfo.comp.layer(j).selected = false;
            }
            
            // Select the target layer
            layerInfo.layer.selected = true;
            
            // Bring After Effects to front
            app.activate();
            
            alert("Layer selected in composition: " + layerInfo.compName);
        } catch (e) {
            alert("Error selecting layer: " + e.toString());
        }
    };
}

// Add compression rate marker to layer
function addCompressionRateMarker(layer, compressionRate) {
    try {
        var markerProperty = layer.property("Marker");
        if (!markerProperty) {
            throw new Error("Layer doesn't support markers");
        }
        
        // Get current time or use layer start time
        var currentTime = layer.containingComp.time;
        var markerTime = Math.max(currentTime, layer.startTime);
        
        // Check if there's already a marker at this time
        var existingComment = "";
        try {
            for (var i = 1; i <= markerProperty.numKeys; i++) {
                var keyTime = markerProperty.keyTime(i);
                if (Math.abs(keyTime - markerTime) < 0.001) {
                    var existingMarker = markerProperty.keyValue(i);
                    existingComment = existingMarker.comment || "";
                    markerProperty.removeKey(i);
                    break;
                }
            }
        } catch (e) {
            // No existing marker at this time
        }
        
        // Create new marker comment
        var newComment = "compression rate = " + compressionRate;
        if (existingComment && existingComment.length > 0) {
            // Append to existing comment if it doesn't already contain compression rate
            if (existingComment.toLowerCase().indexOf("compression rate") === -1) {
                newComment = existingComment + "; " + newComment;
            } else {
                newComment = existingComment;
            }
        }
        
        // Add the marker
        var markerValue = new MarkerValue(newComment);
        markerProperty.setValueAtTime(markerTime, markerValue);
        
    } catch (e) {
        throw new Error("Failed to add marker: " + e.toString());
    }
}

// Start the script
app.beginUndoGroup("Compression Rate Marker Check");
try {
    main();
} catch (e) {
    alert("Script error: " + e.toString());
} finally {
    app.endUndoGroup();
}
})();