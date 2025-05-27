// Mask Point Shifter Palette
// After Effects Script for shifting mask points by whole pixels

(function() {
    "use strict";
    
    // Create UI palette (dockable window)
    var palette = new Window("palette", "Mask Point Shifter");
    palette.orientation = "column";
    palette.alignChildren = "fill";
    palette.spacing = 10;
    palette.margins = 16;
    palette.preferredSize.width = 300;
    
    // Title
    var titleGroup = palette.add("group");
    titleGroup.orientation = "row";
    titleGroup.alignment = "center";
    var titleText = titleGroup.add("statictext", undefined, "Shift Mask Points by Pixels");
    titleText.graphics.font = ScriptUI.newFont("dialog", "bold", 14);
    
    // Info panel
    var infoPanel = palette.add("panel", undefined, "Selection Info");
    infoPanel.orientation = "column";
    infoPanel.alignChildren = "fill";
    infoPanel.margins = 10;
    
    var layerCountText = infoPanel.add("statictext", undefined, "Layers with masks: 0");
    var maskCountText = infoPanel.add("statictext", undefined, "Total masks: 0");
    
    // Input panel
    var inputPanel = palette.add("panel", undefined, "Shift Values");
    inputPanel.orientation = "column";
    inputPanel.alignChildren = "fill";
    inputPanel.margins = 10;
    inputPanel.spacing = 10;
    
    // X offset input
    var xGroup = inputPanel.add("group");
    xGroup.orientation = "row";
    xGroup.alignChildren = "center";
    var xLabel = xGroup.add("statictext", undefined, "X Offset (pixels):");
    xLabel.preferredSize.width = 120;
    var xInput = xGroup.add("edittext", undefined, "0");
    xInput.characters = 8;
    
    // Y offset input
    var yGroup = inputPanel.add("group");
    yGroup.orientation = "row";
    yGroup.alignChildren = "center";
    var yLabel = yGroup.add("statictext", undefined, "Y Offset (pixels):");
    yLabel.preferredSize.width = 120;
    var yInput = yGroup.add("edittext", undefined, "0");
    yInput.characters = 8;
    
    // Options panel
    var optionsPanel = palette.add("panel", undefined, "Options");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "fill";
    optionsPanel.margins = 10;
    
    var allMasksCheckbox = optionsPanel.add("checkbox", undefined, "Apply to all masks on selected layers");
    allMasksCheckbox.value = true;
    
    var selectedMasksCheckbox = optionsPanel.add("checkbox", undefined, "Apply only to selected masks");
    selectedMasksCheckbox.value = false;
    
    // Make checkboxes mutually exclusive
    allMasksCheckbox.onClick = function() {
        if (this.value) {
            selectedMasksCheckbox.value = false;
        }
    };
    
    selectedMasksCheckbox.onClick = function() {
        if (this.value) {
            allMasksCheckbox.value = false;
        } else {
            allMasksCheckbox.value = true;
        }
    };
    
    // Preview panel
    var previewPanel = palette.add("panel", undefined, "Preview");
    previewPanel.orientation = "row";
    previewPanel.alignChildren = "center";
    previewPanel.margins = 10;
    
    var previewButton = previewPanel.add("button", undefined, "Preview Changes");
    var resetButton = previewPanel.add("button", undefined, "Reset Preview");
    resetButton.enabled = false;
    
    // Button panel
    var buttonPanel = palette.add("group");
    buttonPanel.orientation = "row";
    buttonPanel.alignment = "center";
    buttonPanel.spacing = 10;
    
    var refreshButton = buttonPanel.add("button", undefined, "Refresh");
    var applyButton = buttonPanel.add("button", undefined, "Apply");
    
    // Global variables
    var originalMaskData = [];
    var isPreviewActive = false;
    
    // Function to get current composition and selected layers
    function getCurrentSelection() {
        if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return { comp: null, layersWithMasks: [] };
        }
        
        var comp = app.project.activeItem;
        var selectedLayers = comp.selectedLayers;
        
        if (selectedLayers.length === 0) {
            return { comp: comp, layersWithMasks: [] };
        }
        
        // Find layers with masks
        var layersWithMasks = [];
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            if (layer.property("ADBE Mask Parade")) {
                var maskGroup = layer.property("ADBE Mask Parade");
                if (maskGroup.numProperties > 0) {
                    layersWithMasks.push({
                        layer: layer,
                        maskGroup: maskGroup
                    });
                }
            }
        }
        
        return { comp: comp, layersWithMasks: layersWithMasks };
    }
    
    // Function to update info panel
    function updateInfo() {
        var selection = getCurrentSelection();
        var layersWithMasks = selection.layersWithMasks;
        
        var layerCount = layersWithMasks.length;
        var maskCount = 0;
        
        for (var i = 0; i < layersWithMasks.length; i++) {
            maskCount += layersWithMasks[i].maskGroup.numProperties;
        }
        
        layerCountText.text = "Layers with masks: " + layerCount;
        maskCountText.text = "Total masks: " + maskCount;
        
        // Enable/disable buttons based on selection
        var hasValidSelection = layerCount > 0;
        previewButton.enabled = hasValidSelection && !isPreviewActive;
        applyButton.enabled = hasValidSelection;
    }
    
    // Validation function
    function validateInputs() {
        var xValue = parseFloat(xInput.text);
        var yValue = parseFloat(yInput.text);
        
        if (isNaN(xValue) || isNaN(yValue)) {
            alert("Please enter valid numeric values for X and Y offsets.");
            return false;
        }
        
        return { x: xValue, y: yValue };
    }
    
    // Function to get selected mask properties
    function getSelectedMasks() {
        var selection = getCurrentSelection();
        var layersWithMasks = selection.layersWithMasks;
        var selectedMasks = [];
        
        for (var i = 0; i < layersWithMasks.length; i++) {
            var layerData = layersWithMasks[i];
            var maskGroup = layerData.maskGroup;
            
            for (var j = 1; j <= maskGroup.numProperties; j++) {
                var mask = maskGroup.property(j);
                // Check if we should include this mask
                if (allMasksCheckbox.value || mask.selected) {
                    var maskShape = mask.property("ADBE Mask Shape");
                    if (maskShape) {
                        selectedMasks.push({
                            layer: layerData.layer,
                            mask: mask,
                            maskPath: maskShape
                        });
                    }
                }
            }
        }
        
        return selectedMasks;
    }
    
    // Function to shift mask points
    function shiftMaskPoints(maskData, xOffset, yOffset) {
        var maskPath = maskData.maskPath;
        var selection = getCurrentSelection();
        var currentTime = selection.comp.time;
        
        if (maskPath && maskPath.canVaryOverTime) {
            var shape = maskPath.valueAtTime(currentTime, false);
            var vertices = shape.vertices;
            var inTangents = shape.inTangents;
            var outTangents = shape.outTangents;
            var closed = shape.closed;
            
            // Create new vertices array
            var newVertices = [];
            for (var i = 0; i < vertices.length; i++) {
                newVertices[i] = [
                    vertices[i][0] + xOffset,
                    vertices[i][1] + yOffset
                ];
            }
            
            // Create new shape
            var newShape = new Shape();
            newShape.vertices = newVertices;
            newShape.inTangents = inTangents;
            newShape.outTangents = outTangents;
            newShape.closed = closed;
            
            // Apply the change
            if (maskPath.numKeys > 0) {
                // If there are keyframes, set at current time
                maskPath.setValueAtTime(currentTime, newShape);
            } else {
                // If no keyframes, set the value directly
                maskPath.setValue(newShape);
            }
        }
    }
    
    // Preview function
    previewButton.onClick = function() {
        var offsets = validateInputs();
        if (!offsets) return;
        
        var selectedMasks = getSelectedMasks();
        if (selectedMasks.length === 0) {
            alert("No masks found. Please select layers with masks.");
            return;
        }
        
        var selection = getCurrentSelection();
        if (!selection.comp) {
            alert("Please select an active composition.");
            return;
        }
        
        try {
            // Store original data for reset
            originalMaskData = [];
            var currentTime = selection.comp.time;
            
            for (var i = 0; i < selectedMasks.length; i++) {
                var maskData = selectedMasks[i];
                var originalShape = maskData.maskPath.valueAtTime(currentTime, false);
                
                originalMaskData.push({
                    maskPath: maskData.maskPath,
                    originalShape: originalShape,
                    currentTime: currentTime
                });
            }
            
            // Apply preview changes without undo group
            for (var i = 0; i < selectedMasks.length; i++) {
                shiftMaskPoints(selectedMasks[i], offsets.x, offsets.y);
            }
            
            isPreviewActive = true;
            resetButton.enabled = true;
            previewButton.enabled = false;
            
        } catch (error) {
            alert("Error during preview: " + error.toString());
            // Reset state on error
            originalMaskData = [];
            isPreviewActive = false;
        }
    };
    
    // Reset function
    resetButton.onClick = function() {
        if (originalMaskData.length === 0) return;
        
        try {
            for (var i = 0; i < originalMaskData.length; i++) {
                var data = originalMaskData[i];
                if (data.maskPath.numKeys > 0) {
                    data.maskPath.setValueAtTime(data.currentTime, data.originalShape);
                } else {
                    data.maskPath.setValue(data.originalShape);
                }
            }
            
            originalMaskData = [];
            isPreviewActive = false;
            resetButton.enabled = false;
            previewButton.enabled = true;
            
        } catch (error) {
            alert("Error during reset: " + error.toString());
        }
    };
    
    // Apply function
    applyButton.onClick = function() {
        // If preview is active, just clear the preview state
        if (isPreviewActive) {
            originalMaskData = [];
            isPreviewActive = false;
            resetButton.enabled = false;
            previewButton.enabled = true;
            return;
        }
        
        var offsets = validateInputs();
        if (!offsets) return;
        
        var selectedMasks = getSelectedMasks();
        if (selectedMasks.length === 0) {
            alert("No masks found. Please select layers with masks.");
            return;
        }
        
        var selection = getCurrentSelection();
        if (!selection.comp) {
            alert("Please select an active composition.");
            return;
        }
        
        app.beginUndoGroup("Shift Mask Points");
        
        try {
            for (var i = 0; i < selectedMasks.length; i++) {
                shiftMaskPoints(selectedMasks[i], offsets.x, offsets.y);
            }
            
        } catch (error) {
            alert("Error: " + error.toString());
        } finally {
            app.endUndoGroup();
        }
    };
    
    // Refresh function
    refreshButton.onClick = function() {
        // Reset preview if active
        if (isPreviewActive) {
            resetButton.onClick();
        }
        updateInfo();
    };
    
    // Input validation on text change
    xInput.onChanging = yInput.onChanging = function() {
        if (isPreviewActive) {
            resetButton.onClick();
        }
    };
    
    // Update info when palette is first shown
    updateInfo();
    
    // Show palette
    if (palette instanceof Window) {
        palette.center();
        palette.show();
    } else {
        palette.layout.layout(true);
    }
    
})();