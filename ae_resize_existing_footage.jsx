// After Effects Script: Resize Selected Footage and Re-link
// This script processes selected footage items, renders them at 80% size,
// and updates all compositions to use the new footage at 125% scale

(function() {
“use strict”;

```
// Main execution function
function main() {
    // Check if project is open
    if (!app.project) {
        alert("No project is open.");
        return;
    }
    
    // Get selected items from project panel
    var selectedItems = app.project.selection;
    
    if (selectedItems.length === 0) {
        alert("Please select footage items in the Project panel.");
        return;
    }
    
    // Filter only footage items
    var footageItems = [];
    for (var i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i] instanceof FootageItem) {
            footageItems.push(selectedItems[i]);
        }
    }
    
    if (footageItems.length === 0) {
        alert("No footage items selected. Please select footage items in the Project panel.");
        return;
    }
    
    app.beginUndoGroup("Resize and Re-link Footage");
    
    try {
        // Step 1: Add footage to render queue and render
        var renderInfo = addFootageToRenderQueue(footageItems);
        
        if (renderInfo.length === 0) {
            alert("No valid footage items to process.");
            return;
        }
        
        // Start rendering
        app.project.renderQueue.render();
        
        // Wait for render to complete (basic check)
        waitForRenderComplete();
        
        // Step 2: Replace footage and update compositions
        relinkFootageAndUpdateComps(renderInfo);
        
        alert("Process completed successfully!\n" + 
              "- Rendered " + renderInfo.length + " footage items at 80% size\n" +
              "- Updated all compositions with 125% scaled footage");
        
    } catch (error) {
        alert("Error: " + error.toString());
    }
    
    app.endUndoGroup();
}

// Function to add footage items to render queue
function addFootageToRenderQueue(footageItems) {
    var renderInfo = [];
    
    for (var i = 0; i < footageItems.length; i++) {
        var footage = footageItems[i];
        
        // Skip if footage doesn't have a valid file path
        if (!footage.file || !footage.file.exists) {
            continue;
        }
        
        try {
            // Create composition from footage
            var comp = app.project.items.addComp(
                footage.name + "_temp",
                footage.width,
                footage.height,
                footage.pixelAspect,
                footage.duration,
                footage.frameRate
            );
            
            // Add footage to composition
            var layer = comp.layers.add(footage);
            
            // Add composition to render queue
            var renderItem = app.project.renderQueue.items.add(comp);
            
            // Get original file info
            var originalFile = footage.file;
            var originalFolder = originalFile.parent;
            var fileName = originalFile.displayName;
            var nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
            
            // Create output folder
            var outputFolder = new Folder(originalFolder.fsName + "/80");
            if (!outputFolder.exists) {
                outputFolder.create();
            }
            
            // Set output file for PNG sequence (using [#####] for frame numbering)
            var outputFile = new File(outputFolder.fsName + "/" + nameWithoutExt + "_80_[#####].png");
            
            // Configure render settings
            var outputModule = renderItem.outputModule(1);
            outputModule.file = outputFile;
            
            // Set output format to PNG sequence with alpha and no compression
            outputModule.applyTemplate("PNG Sequence");
            outputModule.format = "PNG Sequence";
            outputModule.channels = OutputModuleChannels.RGBA;
            outputModule.depth = OutputModuleDepth.DEPTH_8;
            
            // Set PNG options for no compression
            var pngOptions = outputModule.formatOptions;
            if (pngOptions) {
                // PNG compression level (0 = no compression, 9 = maximum compression)
                try {
                    pngOptions.compression = 0;
                } catch (e) {
                    // Fallback if compression property doesn't exist
                }
            }
            
            // Access render settings to set resize
            var renderSettings = renderItem.outputModule(1);
            renderSettings.includeSourceXMP = false;
            
            // Set custom resize (this might need adjustment based on AE version)
            try {
                // Method 1: Try to set resize directly
                renderSettings.resize = true;
                renderSettings.resizeWidth = Math.round(footage.width * 0.8);
                renderSettings.resizeHeight = Math.round(footage.height * 0.8);
            } catch (e) {
                // Method 2: Scale the layer in composition instead
                layer.transform.scale.setValue([80, 80]);
            }
            
            // Store information for later processing
            renderInfo.push({
                originalFootage: footage,
                tempComp: comp,
                outputFile: outputFile,
                renderItem: renderItem
            });
            
        } catch (error) {
            alert("Error processing " + footage.name + ": " + error.toString());
            continue;
        }
    }
    
    return renderInfo;
}

// Simple function to wait for render completion
function waitForRenderComplete() {
    var maxWaitTime = 300; // 5 minutes max wait
    var waitCount = 0;
    
    while (app.project.renderQueue.numQueuedItems > 0 && waitCount < maxWaitTime) {
        app.scheduleTask("", 1000, false); // Wait 1 second
        waitCount++;
    }
}

// Function to replace footage and update compositions
function relinkFootageAndUpdateComps(renderInfo) {
    for (var i = 0; i < renderInfo.length; i++) {
        var info = renderInfo[i];
        
        try {
            // Check if output folder exists and has PNG files
            var outputFolder = new Folder(info.outputFile.parent.fsName);
            if (!outputFolder.exists) {
                alert("Output folder not found: " + outputFolder.fsName);
                continue;
            }
            
            // For PNG sequences, we need to find the first frame to use as replacement
            var pngFiles = outputFolder.getFiles("*.png");
            if (pngFiles.length === 0) {
                alert("No PNG files found in: " + outputFolder.fsName);
                continue;
            }
            
            // Sort files to get the first frame
            pngFiles.sort();
            var firstFrame = pngFiles[0];
            
            // Store references to compositions using this footage
            var compsUsingFootage = findCompositionsUsingFootage(info.originalFootage);
            
            // Replace footage source with PNG sequence
            info.originalFootage.replace(firstFrame);
            
            // Update all compositions that use this footage
            updateCompositionsScale(compsUsingFootage, info.originalFootage, 125);
            
            // Clean up temporary composition
            info.tempComp.remove();
            
        } catch (error) {
            alert("Error relinking " + info.originalFootage.name + ": " + error.toString());
            continue;
        }
    }
    
    // Clean up render queue
    while (app.project.renderQueue.numQueuedItems > 0) {
        app.project.renderQueue.item(1).remove();
    }
}

// Function to find all compositions using specific footage
function findCompositionsUsingFootage(footage) {
    var compositions = [];
    
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        
        if (item instanceof CompItem) {
            // Check if this composition uses the footage
            for (var j = 1; j <= item.numLayers; j++) {
                var layer = item.layer(j);
                
                if (layer.source === footage) {
                    compositions.push({
                        comp: item,
                        layers: [layer]
                    });
                    break;
                }
            }
        }
    }
    
    return compositions;
}

// Function to update composition layer scales
function updateCompositionsScale(compInfo, footage, scalePercent) {
    for (var i = 0; i < compInfo.length; i++) {
        var comp = compInfo[i].comp;
        
        // Find all layers in this comp that use the footage
        for (var j = 1; j <= comp.numLayers; j++) {
            var layer = comp.layer(j);
            
            if (layer.source === footage) {
                // Get current scale
                var currentScale = layer.transform.scale.value;
                
                // Calculate new scale (multiply by 125%)
                var newScale = [
                    currentScale[0] * (scalePercent / 100),
                    currentScale[1] * (scalePercent / 100)
                ];
                
                // Apply new scale
                layer.transform.scale.setValue(newScale);
            }
        }
    }
}

// Execute main function
main();
```

})();