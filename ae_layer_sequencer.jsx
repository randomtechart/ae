// Layer Sequencer with Marker Movement
// After Effects Script for sequencing layers and moving composition markers

(function() {
    "use strict";
    
    // Check if a composition is active
    if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please select an active composition.");
        return;
    }
    
    var comp = app.project.activeItem;
    var selectedLayers = comp.selectedLayers;
    
    if (selectedLayers.length === 0) {
        alert("Please select at least one layer.");
        return;
    }
    
    // Get user input for frame spacing
    var frameSpacingDialog = new Window("dialog", "Layer Sequencer");
    frameSpacingDialog.orientation = "column";
    frameSpacingDialog.alignChildren = "fill";
    
    var inputGroup = frameSpacingDialog.add("group");
    inputGroup.add("statictext", undefined, "Frame spacing:");
    var frameInput = inputGroup.add("edittext", undefined, "1");
    frameInput.characters = 8;
    
    var buttonGroup = frameSpacingDialog.add("group");
    buttonGroup.alignment = "center";
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    
    okButton.onClick = function() {
        frameSpacingDialog.close(1);
    };
    
    cancelButton.onClick = function() {
        frameSpacingDialog.close(0);
    };
    
    if (frameSpacingDialog.show() === 0) {
        return; // User cancelled
    }
    
    var frameSpacing = parseInt(frameInput.text);
    if (isNaN(frameSpacing) || frameSpacing < 0) {
        alert("Please enter a valid number of frames (0 or greater).");
        return;
    }
    
    // Convert frame spacing to time
    var timeSpacing = frameSpacing / comp.frameRate;
    
    // Function to find composition markers at a specific time
    function findMarkersAtTime(time, tolerance) {
        tolerance = tolerance || 0.001; // Small tolerance for floating point comparison
        var markers = [];
        
        for (var i = 1; i <= comp.markerProperty.numKeys; i++) {
            var markerTime = comp.markerProperty.keyTime(i);
            if (Math.abs(markerTime - time) <= tolerance) {
                markers.push({
                    index: i,
                    time: markerTime,
                    value: comp.markerProperty.keyValue(i)
                });
            }
        }
        return markers;
    }
    
    // Function to check if a marker exists at a specific time
    function markerExistsAtTime(time, tolerance) {
        tolerance = tolerance || 0.001;
        for (var i = 1; i <= comp.markerProperty.numKeys; i++) {
            var markerTime = comp.markerProperty.keyTime(i);
            if (Math.abs(markerTime - time) <= tolerance) {
                return true;
            }
        }
        return false;
    }
    
    // Collect layer data and filter layers that have corresponding markers
    var layerData = [];
    
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var inPoint = layer.inPoint;
        var outPoint = layer.outPoint;
        var startTime = layer.startTime;
        
        // Check if there's a marker at the layer's inpoint
        var markersAtInpoint = findMarkersAtTime(inPoint);
        
        if (markersAtInpoint.length > 0) {
            layerData.push({
                layer: layer,
                inPoint: inPoint,
                outPoint: outPoint,
                startTime: startTime,
                offset: inPoint - startTime,
                duration: outPoint - inPoint,
                markers: markersAtInpoint
            });
        }
    }
    
    if (layerData.length === 0) {
        alert("No selected layers have composition markers at their inpoints.");
        return;
    }
    
    // Sort layers by their outpoint time (for outpoint-based sequencing)
    layerData.sort(function(a, b) {
        return a.outPoint - b.outPoint;
    });
    
    // Begin undo group
    app.beginUndoGroup("Sequence Layers with Markers");
    
    try {
        // Start from the first layer's current outpoint
        var currentOutPoint = layerData[0].outPoint;
        
        // Collect all marker operations to perform them in one batch
        var markerOperations = [];
        
        for (var i = 0; i < layerData.length; i++) {
            var data = layerData[i];
            var layer = data.layer;
            
            // For the first layer, keep its current position
            // For subsequent layers, start after the previous layer's outpoint + gap
            if (i > 0) {
                var newInPoint = currentOutPoint + timeSpacing;
                var newStartTime = newInPoint - data.offset;
                
                // Calculate the time difference for moving markers (based on inpoint change)
                var timeDifference = newInPoint - data.inPoint;
                
                // Move the layer
                layer.startTime = newStartTime;
                
                // Collect marker operations if there's a time difference
                if (Math.abs(timeDifference) > 0.001) { // Only move if there's a significant difference
                    for (var j = 0; j < data.markers.length; j++) {
                        var marker = data.markers[j];
                        var newMarkerTime = marker.time + timeDifference;
                        
                        // Check if a marker already exists at the new time
                        if (!markerExistsAtTime(newMarkerTime)) {
                            markerOperations.push({
                                action: 'remove',
                                index: marker.index,
                                time: marker.time
                            });
                            markerOperations.push({
                                action: 'add',
                                time: newMarkerTime,
                                value: marker.value
                            });
                        }
                        // If a marker already exists at the new time, we don't replace it
                    }
                }
                
                // Update currentOutPoint to this layer's new outpoint
                currentOutPoint = newInPoint + data.duration;
            } else {
                // First layer stays in place, just update currentOutPoint
                currentOutPoint = data.outPoint;
            }
        }
        
        // Execute all marker operations in reverse order for removals to maintain indices
        var removeOperations = [];
        var addOperations = [];
        
        for (var k = 0; k < markerOperations.length; k++) {
            if (markerOperations[k].action === 'remove') {
                removeOperations.push(markerOperations[k]);
            } else {
                addOperations.push(markerOperations[k]);
            }
        }
        
        // Sort remove operations by index in descending order to maintain correct indices
        removeOperations.sort(function(a, b) {
            return b.index - a.index;
        });
        
        // Execute removals first
        for (var m = 0; m < removeOperations.length; m++) {
            comp.markerProperty.removeKey(removeOperations[m].index);
        }
        
        // Execute additions
        for (var n = 0; n < addOperations.length; n++) {
            comp.markerProperty.setValueAtTime(addOperations[n].time, addOperations[n].value);
        }
        
        alert("Successfully sequenced " + layerData.length + " layers with " + frameSpacing + " frame spacing.");
        
    } catch (error) {
        alert("Error: " + error.toString());
    } finally {
        app.endUndoGroup();
    }
    
})();