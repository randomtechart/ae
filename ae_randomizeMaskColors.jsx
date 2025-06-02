// After Effects Script: Randomize Mask Colors
// This script randomizes the colors of all masks on a selected layer

(function randomizeMaskColors() {
    
    // Check if After Effects is available
    if (typeof app === "undefined") {
        alert("This script must be run in After Effects");
        return;
    }
    
    // Undo group for the operation
    app.beginUndoGroup("Randomize Mask Colors");
    
    try {
        var comp = app.project.activeItem;
        
        // Check if there's an active composition
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition first");
            return;
        }
        
        // Check if there are selected layers
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            alert("Please select at least one layer");
            return;
        }
        
        // Function to generate random color (0-1 range for AE)
        function randomColor() {
            return Math.random();
        }
        
        // Function to randomize masks on a single layer
        function randomizeLayerMasks(layer) {
            var masks = layer.property("ADBE Mask Parade");
            if (!masks) {
                return 0; // No masks found
            }
            
            var maskCount = masks.numProperties;
            if (maskCount === 0) {
                return 0; // No masks found
            }
            
            // Randomize each mask color
            for (var i = 1; i <= maskCount; i++) {
                var mask = masks.property(i);
                var colorProp = mask.property("ADBE Mask Color");
                
                if (colorProp) {
                    var newColor = [randomColor(), randomColor(), randomColor()];
                    colorProp.setValue(newColor);
                }
            }
            
            return maskCount;
        }
        
        // Process all selected layers
        var totalMasksProcessed = 0;
        var layersWithMasks = 0;
        
        for (var i = 0; i < selectedLayers.length; i++) {
            var masksOnThisLayer = randomizeLayerMasks(selectedLayers[i]);
            if (masksOnThisLayer > 0) {
                layersWithMasks++;
                totalMasksProcessed += masksOnThisLayer;
            }
        }
        
        // Show results
        if (totalMasksProcessed > 0) {
            alert("Successfully randomized " + totalMasksProcessed + " masks on " + layersWithMasks + " layer(s)");
        } else {
            alert("No masks found on selected layer(s)");
        }
        
    } catch (error) {
        alert("Error: " + error.toString());
    } finally {
        app.endUndoGroup();
    }
    
})();

// Alternative version that prompts for a specific layer name
/*
(function randomizeMaskColorsByName() {
    
    app.beginUndoGroup("Randomize Mask Colors by Name");
    
    try {
        var comp = app.project.activeItem;
        
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition first");
            return;
        }
        
        // Prompt for layer name
        var layerName = prompt("Enter the layer name:", "");
        if (!layerName) {
            return;
        }
        
        // Find layer by name
        var targetLayer = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === layerName) {
                targetLayer = comp.layer(i);
                break;
            }
        }
        
        if (!targetLayer) {
            alert("Layer '" + layerName + "' not found");
            return;
        }
        
        // Function to generate random color
        function randomColor() {
            return Math.random();
        }
        
        // Randomize masks on the target layer
        var masks = targetLayer.property("ADBE Mask Parade");
        if (!masks || masks.numProperties === 0) {
            alert("No masks found on layer '" + layerName + "'");
            return;
        }
        
        var maskCount = masks.numProperties;
        
        for (var i = 1; i <= maskCount; i++) {
            var mask = masks.property(i);
            var colorProp = mask.property("ADBE Mask Color");
            
            if (colorProp) {
                var newColor = [randomColor(), randomColor(), randomColor()];
                colorProp.setValue(newColor);
            }
        }
        
        alert("Successfully randomized " + maskCount + " masks on layer '" + layerName + "'");
        
    } catch (error) {
        alert("Error: " + error.toString());
    } finally {
        app.endUndoGroup();
    }
    
})();
*/