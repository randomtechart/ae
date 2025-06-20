// After Effects Script: Layer Marker Analysis
// Recursively scans all compositions for footage layers and marker status

(function() {


// Check if project is open
if (!app.project) {
    alert("No project is open!");
    return;
}

// Arrays to store results
var layersWithoutMarkers = [];
var layersWithCompressionMarkers = [];

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
                    duration: markerValue.duration || 0,
                    chapter: markerValue.chapter || "",
                    url: markerValue.url || "",
                    frameTarget: markerValue.frameTarget || "",
                    cuePointName: markerValue.cuePointName || ""
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
        
        // Only process image layers (excludes solids, nulls, adjustment layers)
        if (isImageLayer(layer)) {
            var layerInfo = {
                layerName: layer.name,
                compName: comp.name,
                layerIndex: i
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

// Function to generate HTML report
function generateHTMLReport() {
    var html = '<!DOCTYPE html>\n';
    html += '<html lang="en">\n';
    html += '<head>\n';
    html += '    <meta charset="UTF-8">\n';
    html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '    <title>After Effects Layer Marker Analysis Report</title>\n';
    html += '    <style>\n';
    html += '        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }\n';
    html += '        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n';
    html += '        h1 { color: #333; text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }\n';
    html += '        h2 { color: #0066cc; margin-top: 30px; }\n';
    html += '        table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n';
    html += '        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }\n';
    html += '        th { background-color: #0066cc; color: white; font-weight: bold; }\n';
    html += '        tr:nth-child(even) { background-color: #f9f9f9; }\n';
    html += '        tr:hover { background-color: #f0f8ff; }\n';
    html += '        .summary { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }\n';
    html += '        .no-data { text-align: center; color: #666; font-style: italic; padding: 20px; }\n';
    html += '        .timestamp { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }\n';
    html += '    </style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '    <div class="container">\n';
    html += '        <h1>After Effects Layer Marker Analysis Report</h1>\n';
    html += '        <div class="summary">\n';
    html += '            <strong>Analysis Summary:</strong><br>\n';
    html += '            • Image layers without markers: ' + layersWithoutMarkers.length + '<br>\n';
    html += '            • Image layers with compression markers: ' + layersWithCompressionMarkers.length + '<br>\n';
    html += '            • <em>Note: Analysis includes only image/video layers. Excludes solid colors, null objects, adjustment layers, and shape layers.</em>\n';
    html += '        </div>\n';
    
    // Table 1: Layers without markers
    html += '        <h2>Image Layers Without Markers</h2>\n';
    if (layersWithoutMarkers.length > 0) {
        html += '        <table>\n';
        html += '            <thead>\n';
        html += '                <tr>\n';
        html += '                    <th>Layer Name</th>\n';
        html += '                    <th>Composition</th>\n';
        html += '                    <th>Layer Index</th>\n';
        html += '                </tr>\n';
        html += '            </thead>\n';
        html += '            <tbody>\n';
        
        for (var i = 0; i < layersWithoutMarkers.length; i++) {
            var layer = layersWithoutMarkers[i];
            html += '                <tr>\n';
            html += '                    <td>' + escapeHtml(layer.layerName) + '</td>\n';
            html += '                    <td>' + escapeHtml(layer.compName) + '</td>\n';
            html += '                    <td>' + layer.layerIndex + '</td>\n';
            html += '                </tr>\n';
        }
        
        html += '            </tbody>\n';
        html += '        </table>\n';
    } else {
        html += '        <div class="no-data">No image layers without markers found.</div>\n';
    }
    
    // Table 2: Layers with compression markers
    html += '        <h2>Image Layers With Compression Markers</h2>\n';
    if (layersWithCompressionMarkers.length > 0) {
        html += '        <table>\n';
        html += '            <thead>\n';
        html += '                <tr>\n';
        html += '                    <th>Layer Name</th>\n';
        html += '                    <th>Composition</th>\n';
        html += '                    <th>Layer Index</th>\n';
        html += '                    <th>Marker Time</th>\n';
        html += '                    <th>Marker Comment</th>\n';
        html += '                    <th>Duration</th>\n';
        html += '                    <th>Additional Info</th>\n';
        html += '                </tr>\n';
        html += '            </thead>\n';
        html += '            <tbody>\n';
        
        for (var i = 0; i < layersWithCompressionMarkers.length; i++) {
            var layer = layersWithCompressionMarkers[i];
            var markerCount = layer.markerDetails.length;
            
            for (var j = 0; j < markerCount; j++) {
                var marker = layer.markerDetails[j];
                var timeString = formatTime(marker.time);
                var durationString = marker.duration > 0 ? formatTime(marker.duration) : "-";
                
                // Build additional info string
                var additionalInfo = [];
                if (marker.chapter) additionalInfo.push("Chapter: " + marker.chapter);
                if (marker.url) additionalInfo.push("URL: " + marker.url);
                if (marker.frameTarget) additionalInfo.push("Frame Target: " + marker.frameTarget);
                if (marker.cuePointName) additionalInfo.push("Cue Point: " + marker.cuePointName);
                var additionalInfoString = additionalInfo.length > 0 ? additionalInfo.join("<br>") : "-";
                
                html += '                <tr>\n';
                // Only show layer info on first marker row for this layer
                if (j === 0) {
                    html += '                    <td rowspan="' + markerCount + '">' + escapeHtml(layer.layerName) + '</td>\n';
                    html += '                    <td rowspan="' + markerCount + '">' + escapeHtml(layer.compName) + '</td>\n';
                    html += '                    <td rowspan="' + markerCount + '">' + layer.layerIndex + '</td>\n';
                }
                html += '                    <td>' + timeString + '</td>\n';
                html += '                    <td>' + escapeHtml(marker.comment) + '</td>\n';
                html += '                    <td>' + durationString + '</td>\n';
                html += '                    <td>' + additionalInfoString + '</td>\n';
                html += '                </tr>\n';
            }
        }
        
        html += '            </tbody>\n';
        html += '        </table>\n';
    } else {
        html += '        <div class="no-data">No image layers with compression markers found.</div>\n';
    }
    
    html += '        <div class="timestamp">Report generated on: ' + new Date().toString() + '</div>\n';
    html += '    </div>\n';
    html += '</body>\n';
    html += '</html>';
    
    return html;
}

// Function to format time in seconds to readable format
function formatTime(timeInSeconds) {
    var hours = Math.floor(timeInSeconds / 3600);
    var minutes = Math.floor((timeInSeconds % 3600) / 60);
    var seconds = Math.floor(timeInSeconds % 60);
    var frames = Math.round((timeInSeconds % 1) * 30); // Assuming 30fps, adjust as needed
    
    var timeString = "";
    if (hours > 0) {
        timeString += hours + ":";
    }
    timeString += (minutes < 10 ? "0" : "") + minutes + ":";
    timeString += (seconds < 10 ? "0" : "") + seconds;
    if (frames > 0) {
        timeString += ":" + (frames < 10 ? "0" : "") + frames;
    }
    
    return timeString;
}

// Function to escape HTML characters
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    return text.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

// Function to save HTML file
function saveHTMLFile(htmlContent) {
    var outputFile = File.saveDialog("Save HTML Report", "*.html");
    if (outputFile) {
        outputFile.open("w");
        outputFile.write(htmlContent);
        outputFile.close();
        
        alert("Report saved successfully!\n\nFiles analyzed:\n" + 
              "• Image layers without markers: " + layersWithoutMarkers.length + "\n" +
              "• Image layers with compression markers: " + layersWithCompressionMarkers.length + "\n\n" +
              "Report saved to: " + outputFile.fsName);
    }
}

// Main execution
try {
    // Show progress
    app.beginUndoGroup("Layer Marker Analysis");
    
    // Process all compositions
    processCompositions();
    
    // Generate HTML report
    var htmlReport = generateHTMLReport();
    
    // Save the file
    saveHTMLFile(htmlReport);
    
} catch (error) {
    alert("Error occurred: " + error.toString());
} finally {
    app.endUndoGroup();
}


})();