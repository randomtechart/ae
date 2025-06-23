// After Effects Script: Layer Marker Analysis UI Panel
// Creates a dockable UI panel for managing layer markers

(function() {

```
// Check if project is open
if (!app.project) {
    alert("No project is open!");
    return;
}

// Global variables
var layersWithoutMarkers = [];
var layersWithCompressionMarkers = [];
var mainPanel;
var listGroup;
var statusText;

// Function to check if a layer has an image source (excludes solids, nulls, adjustment layers)
function isImageLayer(layer) {
    // Must be an AVLayer with a valid source
    if (!(layer instanceof AVLayer) || !layer.source) {
        return false;
    }
    
    // Exclude solid sources
    if (layer.source instanceof SolidSource) {
        return false;
    }
    
    // Exclude null objects (they don't have a source)
    if (layer.nullLayer) {
        return false;
    }
    
    // Exclude adjustment layers
    if (layer.adjustmentLayer) {
        return false;
    }
    
    // Must be FootageItem (images, video files)
    return layer.source instanceof FootageItem;
}

// Function to check if layer has any markers
function hasMarkers(layer) {
    try {
        return layer.property("Marker").numKeys > 0;
    } catch (e) {
        return false;
    }
}

// Function to get compression marker details
function getCompressionMarkerDetails(layer) {
    var markerDetails = [];
    try {
        var markerProp = layer.property("Marker");
        for (var i = 1; i <= markerProp.numKeys; i++) {
            var markerValue = markerProp.keyValue(i);
            if (markerValue.comment && markerValue.comment.toLowerCase().indexOf("compression") !== -1) {
                var markerTime = markerProp.keyTime(i);
                markerDetails.push({
                    time: markerTime,
                    comment: markerValue.comment,
                    duration: markerValue.duration || 0
                });
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return markerDetails;
}

// Function to recursively process all compositions
function processCompositions() {
    layersWithoutMarkers = [];
    layersWithCompressionMarkers = [];
    
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem) {
            processComposition(item);
        }
    }
}

// Function to process individual composition
function processComposition(comp) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        
        // Only process image layers
        if (isImageLayer(layer)) {
            var layerInfo = {
                layerName: layer.name,
                compName: comp.name,
                layerIndex: i,
                comp: comp,
                layer: layer
            };
            
            if (!hasMarkers(layer)) {
                // Layer has no markers
                layersWithoutMarkers.push(layerInfo);
            } else {
                // Check for compression markers and get details
                var compressionMarkers = getCompressionMarkerDetails(layer);
                if (compressionMarkers.length > 0) {
                    layerInfo.markerDetails = compressionMarkers;
                    layersWithCompressionMarkers.push(layerInfo);
                }
            }
        }
    }
}

// Function to add compression marker to layer
function addCompressionMarker(layerInfo, customText) {
    try {
        app.beginUndoGroup("Add Compression Marker");
        
        var layer = layerInfo.layer;
        var markerProp = layer.property("Marker");
        var currentTime = layerInfo.comp.time;
        
        // Create marker text
        var markerText = customText || "compression = true";
        
        // Add new marker
        var newMarkerIndex = markerProp.addKey(currentTime);
        var markerValue = new MarkerValue(markerText);
        markerProp.setValueAtKey(newMarkerIndex, markerValue);
        
        app.endUndoGroup();
        return true;
    } catch (error) {
        app.endUndoGroup();
        alert("Error adding marker: " + error.toString());
        return false;
    }
}

// Function to create UI panel
function createUI() {
    // Create main panel
    mainPanel = new Window("dialog", "Layer Marker Manager");
    mainPanel.orientation = "column";
    mainPanel.alignChildren = "fill";
    mainPanel.preferredSize.width = 600;
    mainPanel.preferredSize.height = 500;
    
    // Header
    var headerGroup = mainPanel.add("group");
    headerGroup.orientation = "row";
    headerGroup.alignChildren = "center";
    
    var titleText = headerGroup.add("statictext", undefined, "Layer Marker Analysis");
    titleText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);
    
    var refreshBtn = headerGroup.add("button", undefined, "Refresh");
    refreshBtn.onClick = function() {
        refreshData();
    };
    
    // Status
    statusText = mainPanel.add("statictext", undefined, "Click Refresh to analyze project...");
    statusText.preferredSize.height = 20;
    
    // Tabs
    var tabPanel = mainPanel.add("tabbedpanel");
    tabPanel.alignChildren = "fill";
    tabPanel.preferredSize.height = 400;
    
    // Tab 1: Layers without markers
    var tab1 = tabPanel.add("tab", undefined, "Layers Without Markers");
    tab1.orientation = "column";
    tab1.alignChildren = "fill";
    
    var scrollGroup1 = tab1.add("group");
    scrollGroup1.orientation = "column";
    scrollGroup1.alignChildren = "fill";
    scrollGroup1.spacing = 2;
    
    var panel1 = scrollGroup1.add("panel");
    panel1.orientation = "column";
    panel1.alignChildren = "fill";
    panel1.preferredSize.height = 350;
    
    listGroup = panel1.add("group");
    listGroup.orientation = "column";
    listGroup.alignChildren = "fill";
    listGroup.spacing = 5;
    
    // Tab 2: Layers with compression markers
    var tab2 = tabPanel.add("tab", undefined, "Layers With Compression Markers");
    tab2.orientation = "column";
    tab2.alignChildren = "fill";
    
    var scrollGroup2 = tab2.add("group");
    scrollGroup2.orientation = "column";
    scrollGroup2.alignChildren = "fill";
    scrollGroup2.spacing = 2;
    
    var panel2 = scrollGroup2.add("panel");
    panel2.orientation = "column";
    panel2.alignChildren = "fill";
    panel2.preferredSize.height = 350;
    
    var compressionListGroup = panel2.add("group");
    compressionListGroup.orientation = "column";
    compressionListGroup.alignChildren = "fill";
    compressionListGroup.spacing = 5;
    
    // Store references for later use
    mainPanel.noMarkersGroup = listGroup;
    mainPanel.compressionGroup = compressionListGroup;
    
    // Bottom buttons
    var buttonGroup = mainPanel.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    
    var closeBtn = buttonGroup.add("button", undefined, "Close");
    closeBtn.onClick = function() {
        mainPanel.close();
    };
    
    return mainPanel;
}

// Function to create layer item UI
function createLayerItem(parent, layerInfo, hasMarkers) {
    var itemGroup = parent.add("group");
    itemGroup.orientation = "column";
    itemGroup.alignChildren = "fill";
    itemGroup.spacing = 3;
    
    // Main info row
    var mainRow = itemGroup.add("group");
    mainRow.orientation = "row";
    mainRow.alignChildren = "center";
    
    // Layer info
    var infoGroup = mainRow.add("group");
    infoGroup.orientation = "column";
    infoGroup.alignChildren = "left";
    infoGroup.preferredSize.width = 300;
    
    var layerNameText = infoGroup.add("statictext", undefined, "Layer: " + layerInfo.layerName);
    layerNameText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
    
    var compNameText = infoGroup.add("statictext", undefined, "Comp: " + layerInfo.compName);
    compNameText.graphics.font = ScriptUI.newFont("Arial", "REGULAR", 10);
    
    if (!hasMarkers) {
        // Text input and fix button for layers without markers
        var textInput = mainRow.add("edittext", undefined, "compression = true");
        textInput.preferredSize.width = 150;
        
        var fixBtn = mainRow.add("button", undefined, "Fix It");
        fixBtn.preferredSize.width = 60;
        
        fixBtn.onClick = function() {
            if (addCompressionMarker(layerInfo, textInput.text)) {
                fixBtn.enabled = false;
                fixBtn.text = "Fixed";
                
                // Update status
                statusText.text = "Added marker to: " + layerInfo.layerName;
            }
        };
    } else {
        // Show existing markers
        if (layerInfo.markerDetails) {
            for (var i = 0; i < layerInfo.markerDetails.length; i++) {
                var marker = layerInfo.markerDetails[i];
                var markerText = mainRow.add("statictext", undefined, "Marker: " + marker.comment);
                markerText.graphics.font = ScriptUI.newFont("Arial", "ITALIC", 10);
                markerText.preferredSize.width = 200;
            }
        }
    }
    
    // Separator line
    var separator = itemGroup.add("panel");
    separator.preferredSize.height = 1;
    
    return itemGroup;
}

// Function to refresh data and UI
function refreshData() {
    try {
        // Clear existing UI elements
        while (mainPanel.noMarkersGroup.children.length > 0) {
            mainPanel.noMarkersGroup.remove(mainPanel.noMarkersGroup.children[0]);
        }
        while (mainPanel.compressionGroup.children.length > 0) {
            mainPanel.compressionGroup.remove(mainPanel.compressionGroup.children[0]);
        }
        
        // Process compositions
        processCompositions();
        
        // Update status
        statusText.text = "Found " + layersWithoutMarkers.length + " layers without markers, " + 
                         layersWithCompressionMarkers.length + " with compression markers";
        
        // Populate layers without markers
        if (layersWithoutMarkers.length > 0) {
            for (var i = 0; i < layersWithoutMarkers.length; i++) {
                createLayerItem(mainPanel.noMarkersGroup, layersWithoutMarkers[i], false);
            }
        } else {
            var noDataText = mainPanel.noMarkersGroup.add("statictext", undefined, "No image layers without markers found.");
            noDataText.alignment = "center";
        }
        
        // Populate layers with compression markers
        if (layersWithCompressionMarkers.length > 0) {
            for (var i = 0; i < layersWithCompressionMarkers.length; i++) {
                createLayerItem(mainPanel.compressionGroup, layersWithCompressionMarkers[i], true);
            }
        } else {
            var noDataText2 = mainPanel.compressionGroup.add("statictext", undefined, "No image layers with compression markers found.");
            noDataText2.alignment = "center";
        }
        
        // Refresh UI
        mainPanel.layout.layout(true);
        
    } catch (error) {
        alert("Error refreshing data: " + error.toString());
    }
}

// Main execution
try {
    // Create and show UI
    var panel = createUI();
    
    // Initial data load
    refreshData();
    
    // Show panel
    panel.show();
    
} catch (error) {
    alert("Error creating UI: " + error.toString());
}
```

})();