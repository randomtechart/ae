// After Effects Project HTML Report Generator
// Save this as a .jsx file and run it from After Effects

function generateHTMLReport() {
// Check if a project is open
if (!app.project) {
alert(“Please open a project first.”);
return;
}

```
var project = app.project;
var htmlContent = "";

// HTML header with CSS styling
htmlContent += "<!DOCTYPE html>\n";
htmlContent += "<html lang='en'>\n";
htmlContent += "<head>\n";
htmlContent += "    <meta charset='UTF-8'>\n";
htmlContent += "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n";
htmlContent += "    <title>After Effects Project Report - " + project.file.name + "</title>\n";
htmlContent += "    <style>\n";
htmlContent += "        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }\n";
htmlContent += "        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n";
htmlContent += "        h1 { color: #333; text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }\n";
htmlContent += "        h2 { color: #0066cc; margin-top: 30px; border-left: 4px solid #0066cc; padding-left: 10px; }\n";
htmlContent += "        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: white; }\n";
htmlContent += "        th { background-color: #0066cc; color: white; padding: 12px; text-align: left; font-weight: bold; }\n";
htmlContent += "        td { padding: 10px; border-bottom: 1px solid #ddd; vertical-align: top; }\n";
htmlContent += "        tr:nth-child(even) { background-color: #f9f9f9; }\n";
htmlContent += "        tr:hover { background-color: #f0f8ff; }\n";
htmlContent += "        .file-size { text-align: right; }\n";
htmlContent += "        .duration { text-align: center; }\n";
htmlContent += "        .dimensions { text-align: center; font-family: monospace; }\n";
htmlContent += "        .markers { max-width: 300px; word-wrap: break-word; }\n";
htmlContent += "        .project-info { background-color: #e6f3ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }\n";
htmlContent += "    </style>\n";
htmlContent += "</head>\n";
htmlContent += "<body>\n";
htmlContent += "    <div class='container'>\n";

// Project header
htmlContent += "        <h1>After Effects Project Report</h1>\n";
htmlContent += "        <div class='project-info'>\n";
htmlContent += "            <strong>Project:</strong> " + project.file.name + "<br>\n";
htmlContent += "            <strong>Generated:</strong> " + new Date().toString() + "<br>\n";
htmlContent += "            <strong>Total Items:</strong> " + project.numItems + "\n";
htmlContent += "        </div>\n";

// Table 1: Footage Items
htmlContent += "        <h2>1. Footage Items</h2>\n";
htmlContent += "        <table>\n";
htmlContent += "            <tr>\n";
htmlContent += "                <th>Name</th>\n";
htmlContent += "                <th>Dimensions</th>\n";
htmlContent += "                <th>Duration</th>\n";
htmlContent += "                <th>File Size</th>\n";
htmlContent += "                <th>File Path</th>\n";
htmlContent += "            </tr>\n";

for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);
    if (item instanceof FootageItem) {
        htmlContent += "            <tr>\n";
        htmlContent += "                <td>" + item.name + "</td>\n";
        htmlContent += "                <td class='dimensions'>" + item.width + " x " + item.height + "</td>\n";
        htmlContent += "                <td class='duration'>" + formatTime(item.duration, item.frameRate || 30) + "</td>\n";
        
        // File size
        var fileSize = "N/A";
        if (item.file) {
            try {
                fileSize = formatFileSize(item.file.length);
            } catch (e) {
                fileSize = "Unknown";
            }
        }
        htmlContent += "                <td class='file-size'>" + fileSize + "</td>\n";
        
        // File path
        var filePath = item.file ? item.file.fsName : "Missing";
        htmlContent += "                <td>" + filePath + "</td>\n";
        htmlContent += "            </tr>\n";
    }
}
htmlContent += "        </table>\n";

// Table 2: Compositions
htmlContent += "        <h2>2. Compositions</h2>\n";
htmlContent += "        <table>\n";
htmlContent += "            <tr>\n";
htmlContent += "                <th>Name</th>\n";
htmlContent += "                <th>Duration</th>\n";
htmlContent += "                <th>Dimensions</th>\n";
htmlContent += "                <th>Frame Rate</th>\n";
htmlContent += "                <th>Composition Markers</th>\n";
htmlContent += "            </tr>\n";

for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);
    if (item instanceof CompItem) {
        htmlContent += "            <tr>\n";
        htmlContent += "                <td>" + item.name + "</td>\n";
        htmlContent += "                <td class='duration'>" + formatTime(item.duration, item.frameRate) + "</td>\n";
        htmlContent += "                <td class='dimensions'>" + item.width + " x " + item.height + "</td>\n";
        htmlContent += "                <td class='duration'>" + item.frameRate.toFixed(2) + " fps</td>\n";
        
        // Composition markers
        var markersText = getMarkersText(item.markerProperty, item.frameRate);
        htmlContent += "                <td class='markers'>" + markersText + "</td>\n";
        htmlContent += "            </tr>\n";
    }
}
htmlContent += "        </table>\n";

// Table 3: All Layers
htmlContent += "        <h2>3. All Layers</h2>\n";
htmlContent += "        <table>\n";
htmlContent += "            <tr>\n";
htmlContent += "                <th>Layer Name</th>\n";
htmlContent += "                <th>Index</th>\n";
htmlContent += "                <th>Parent Composition</th>\n";
htmlContent += "                <th>In Point</th>\n";
htmlContent += "                <th>Out Point</th>\n";
htmlContent += "                <th>Layer Markers</th>\n";
htmlContent += "            </tr>\n";

for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);
    if (item instanceof CompItem) {
        for (var j = 1; j <= item.numLayers; j++) {
            var layer = item.layer(j);
            htmlContent += "            <tr>\n";
            htmlContent += "                <td>" + layer.name + "</td>\n";
            htmlContent += "                <td class='duration'>" + layer.index + "</td>\n";
            htmlContent += "                <td>" + item.name + "</td>\n";
            htmlContent += "                <td class='duration'>" + formatTime(layer.inPoint, item.frameRate) + "</td>\n";
            htmlContent += "                <td class='duration'>" + formatTime(layer.outPoint, item.frameRate) + "</td>\n";
            
            // Layer markers
            var layerMarkersText = "";
            try {
                layerMarkersText = getMarkersText(layer.property("Marker"), item.frameRate);
            } catch (e) {
                layerMarkersText = "No markers";
            }
            htmlContent += "                <td class='markers'>" + layerMarkersText + "</td>\n";
            htmlContent += "            </tr>\n";
        }
    }
}
htmlContent += "        </table>\n";

// HTML footer
htmlContent += "    </div>\n";
htmlContent += "</body>\n";
htmlContent += "</html>";

// Save the HTML file
var outputFile = new File(project.file.path + "/" + project.file.name.replace(/\.[^.]+$/, "") + "_Report.html");

// Let user choose save location
outputFile = outputFile.saveDlg("Save HTML Report", "*.html");

if (outputFile) {
    outputFile.open("w");
    outputFile.write(htmlContent);
    outputFile.close();
    
    alert("HTML report generated successfully!\nLocation: " + outputFile.fsName);
    
    // Optionally open the file
    if (confirm("Would you like to open the report in your default browser?")) {
        outputFile.execute();
    }
}
```

}

// Helper function to format time in seconds to frame numbers
function formatTime(timeInSeconds, frameRate) {
if (timeInSeconds == undefined || timeInSeconds == null) return “N/A”;
if (!frameRate) frameRate = 30; // Default frame rate

```
var totalFrames = Math.round(timeInSeconds * frameRate);
return totalFrames + " frames";
```

}

// Helper function to format file size
function formatFileSize(bytes) {
if (bytes == 0) return “0 Bytes”;
var k = 1024;
var sizes = [“Bytes”, “KB”, “MB”, “GB”, “TB”];
var i = Math.floor(Math.log(bytes) / Math.log(k));
return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + “ “ + sizes[i];
}

// Helper function to extract marker information
function getMarkersText(markerProperty, frameRate) {
var markersText = “”;

```
if (!markerProperty) return "No markers";
if (!frameRate) frameRate = 30; // Default frame rate

try {
    var numMarkers = markerProperty.numKeys;
    if (numMarkers == 0) return "No markers";
    
    for (var i = 1; i <= numMarkers; i++) {
        var markerTime = markerProperty.keyTime(i);
        var markerValue = markerProperty.keyValue(i);
        
        markersText += "<strong>" + formatTime(markerTime, frameRate) + "</strong>: ";
        
        // Extract marker properties
        if (markerValue.comment) {
            markersText += markerValue.comment;
        }
        if (markerValue.chapter) {
            markersText += " [Chapter: " + markerValue.chapter + "]";
        }
        if (markerValue.url) {
            markersText += " [URL: " + markerValue.url + "]";
        }
        if (markerValue.frameTarget) {
            markersText += " [Frame: " + markerValue.frameTarget + "]";
        }
        
        if (i < numMarkers) markersText += "<br>";
    }
} catch (e) {
    markersText = "Error reading markers";
}

return markersText || "No marker content";
```

}

// Polyfill for padStart if not available
if (!String.prototype.padStart) {
String.prototype.padStart = function padStart(targetLength, padString) {
targetLength = targetLength >> 0;
padString = String(typeof padString !== ‘undefined’ ? padString : ’ ’);
if (this.length > targetLength) {
return String(this);
} else {
targetLength = targetLength - this.length;
if (targetLength > padString.length) {
padString += padString.repeat(targetLength / padString.length);
}
return padString.slice(0, targetLength) + String(this);
}
};
}

// Run the script
generateHTMLReport();