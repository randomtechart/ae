// Mask Point Analyzer - HTML Export
// After Effects Script for analyzing mask point positions across keyframes

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
        alert("Please select at least one layer with masks.");
        return;
    }
    
    // Find layers with masks
    var layersWithMasks = [];
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        if (layer.property("ADBE Mask Parade")) {
            var maskGroup = layer.property("ADBE Mask Parade");
            if (maskGroup.numProperties > 0) {
                for (var j = 1; j <= maskGroup.numProperties; j++) {
                    var mask = maskGroup.property(j);
                    var maskShape = mask.property("ADBE Mask Shape");
                    if (maskShape) {
                        layersWithMasks.push({
                            layer: layer,
                            mask: mask,
                            maskShape: maskShape,
                            layerName: layer.name,
                            maskName: mask.name
                        });
                    }
                }
            }
        }
    }
    
    if (layersWithMasks.length === 0) {
        alert("No masks found on selected layers.");
        return;
    }
    
    // Helper function to check if a number is subpixel
    function isSubpixel(value) {
        return Math.abs(value - Math.round(value)) > 0.001;
    }
    
    // Helper function to format coordinate value
    function formatCoordinate(value) {
        return value.toFixed(3);
    }
    
    // Helper function to get all keyframe times for a property
    function getKeyframeTimes(property) {
        var times = [];
        if (property.numKeys > 0) {
            for (var i = 1; i <= property.numKeys; i++) {
                times.push(property.keyTime(i));
            }
        } else {
            // If no keyframes, sample at current time
            times.push(comp.time);
        }
        return times;
    }
    
    // Helper function to get all unique times from all masks
    function getAllSampleTimes(masksData) {
        var allTimes = [];
        var timeMap = {};
        
        for (var i = 0; i < masksData.length; i++) {
            var keyframeTimes = getKeyframeTimes(masksData[i].maskShape);
            for (var j = 0; j < keyframeTimes.length; j++) {
                var timeKey = keyframeTimes[j].toFixed(4);
                if (!timeMap[timeKey]) {
                    timeMap[timeKey] = true;
                    allTimes.push(keyframeTimes[j]);
                }
            }
        }
        
        // Sort times
        allTimes.sort(function(a, b) { return a - b; });
        
        // If no keyframes found, sample the entire composition
        if (allTimes.length === 0) {
            var frameRate = comp.frameRate;
            var duration = comp.duration;
            var frameDuration = 1 / frameRate;
            
            for (var t = 0; t <= duration; t += frameDuration) {
                allTimes.push(t);
            }
        }
        
        return allTimes;
    }
    
    // Helper function to convert time to frame number
    function timeToFrame(time, frameRate) {
        return Math.round(time * frameRate);
    }
    
    // Helper function to format time display
    function formatTime(time, frameRate) {
        var frame = timeToFrame(time, frameRate);
        var seconds = time.toFixed(3);
        return "Frame " + frame + " (" + seconds + "s)";
    }
    
    // Collect mask data
    var maskData = [];
    var sampleTimes = getAllSampleTimes(layersWithMasks);
    
    for (var i = 0; i < layersWithMasks.length; i++) {
        var maskInfo = layersWithMasks[i];
        var maskShape = maskInfo.maskShape;
        
        var maskPoints = [];
        
        for (var timeIndex = 0; timeIndex < sampleTimes.length; timeIndex++) {
            var time = sampleTimes[timeIndex];
            var shape = maskShape.valueAtTime(time, false);
            var vertices = shape.vertices;
            
            var timeData = {
                time: time,
                frame: timeToFrame(time, comp.frameRate),
                points: []
            };
            
            for (var pointIndex = 0; pointIndex < vertices.length; pointIndex++) {
                var x = vertices[pointIndex][0];
                var y = vertices[pointIndex][1];
                
                timeData.points.push({
                    index: pointIndex,
                    x: x,
                    y: y,
                    isSubpixelX: isSubpixel(x),
                    isSubpixelY: isSubpixel(y)
                });
            }
            
            maskPoints.push(timeData);
        }
        
        maskData.push({
            layerName: maskInfo.layerName,
            maskName: maskInfo.maskName,
            points: maskPoints
        });
    }
    
    // Generate HTML content
    var htmlContent = '<!DOCTYPE html>\n' +
        '<html lang="en">\n' +
        '<head>\n' +
        '    <meta charset="UTF-8">\n' +
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
        '    <title>Mask Point Analysis - ' + comp.name + '</title>\n' +
        '    <style>\n' +
        '        body {\n' +
        '            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;\n' +
        '            margin: 0;\n' +
        '            padding: 20px;\n' +
        '            background-color: #f5f5f5;\n' +
        '            color: #333;\n' +
        '        }\n' +
        '        .header {\n' +
        '            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n' +
        '            color: white;\n' +
        '            padding: 30px;\n' +
        '            border-radius: 10px;\n' +
        '            margin-bottom: 30px;\n' +
        '            box-shadow: 0 4px 15px rgba(0,0,0,0.1);\n' +
        '        }\n' +
        '        .header h1 {\n' +
        '            margin: 0 0 10px 0;\n' +
        '            font-size: 2.5em;\n' +
        '        }\n' +
        '        .header .subtitle {\n' +
        '            font-size: 1.1em;\n' +
        '            opacity: 0.9;\n' +
        '        }\n' +
        '        .legend {\n' +
        '            background: white;\n' +
        '            padding: 20px;\n' +
        '            border-radius: 8px;\n' +
        '            margin-bottom: 20px;\n' +
        '            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n' +
        '        }\n' +
        '        .legend h3 {\n' +
        '            margin-top: 0;\n' +
        '            color: #4a5568;\n' +
        '        }\n' +
        '        .color-indicator {\n' +
        '            display: inline-block;\n' +
        '            width: 20px;\n' +
        '            height: 20px;\n' +
        '            margin-right: 10px;\n' +
        '            vertical-align: middle;\n' +
        '            border-radius: 3px;\n' +
        '        }\n' +
        '        .mask-section {\n' +
        '            background: white;\n' +
        '            margin-bottom: 30px;\n' +
        '            border-radius: 8px;\n' +
        '            overflow: hidden;\n' +
        '            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n' +
        '        }\n' +
        '        .mask-header {\n' +
        '            background: #4a5568;\n' +
        '            color: white;\n' +
        '            padding: 20px;\n' +
        '            font-size: 1.3em;\n' +
        '            font-weight: bold;\n' +
        '        }\n' +
        '        .time-section {\n' +
        '            border-bottom: 1px solid #e2e8f0;\n' +
        '            padding: 20px;\n' +
        '        }\n' +
        '        .time-section:last-child {\n' +
        '            border-bottom: none;\n' +
        '        }\n' +
        '        .time-header {\n' +
        '            font-size: 1.1em;\n' +
        '            font-weight: bold;\n' +
        '            margin-bottom: 15px;\n' +
        '            color: #2d3748;\n' +
        '            border-left: 4px solid #667eea;\n' +
        '            padding-left: 15px;\n' +
        '        }\n' +
        '        .points-grid {\n' +
        '            display: grid;\n' +
        '            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n' +
        '            gap: 15px;\n' +
        '        }\n' +
        '        .point-card {\n' +
        '            background: #f8f9fa;\n' +
        '            padding: 15px;\n' +
        '            border-radius: 6px;\n' +
        '            border: 1px solid #e9ecef;\n' +
        '        }\n' +
        '        .point-index {\n' +
        '            font-weight: bold;\n' +
        '            margin-bottom: 8px;\n' +
        '            color: #495057;\n' +
        '        }\n' +
        '        .coordinate {\n' +
        '            font-family: "Courier New", monospace;\n' +
        '            font-size: 0.95em;\n' +
        '            margin: 2px 0;\n' +
        '        }\n' +
        '        .subpixel {\n' +
        '            color: #dc3545;\n' +
        '            font-weight: bold;\n' +
        '        }\n' +
        '        .whole-pixel {\n' +
        '            color: #007bff;\n' +
        '        }\n' +
        '        .stats {\n' +
        '            background: white;\n' +
        '            padding: 20px;\n' +
        '            border-radius: 8px;\n' +
        '            margin-bottom: 20px;\n' +
        '            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n' +
        '        }\n' +
        '        .stats-grid {\n' +
        '            display: grid;\n' +
        '            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n' +
        '            gap: 20px;\n' +
        '        }\n' +
        '        .stat-item {\n' +
        '            text-align: center;\n' +
        '        }\n' +
        '        .stat-number {\n' +
        '            font-size: 2em;\n' +
        '            font-weight: bold;\n' +
        '            color: #667eea;\n' +
        '        }\n' +
        '        .stat-label {\n' +
        '            color: #6c757d;\n' +
        '            margin-top: 5px;\n' +
        '        }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '    <div class="header">\n' +
        '        <h1>Mask Point Analysis</h1>\n' +
        '        <div class="subtitle">Composition: ' + comp.name + ' | Generated: ' + new Date().toLocaleString() + '</div>\n' +
        '    </div>\n\n';
    
    // Calculate statistics
    var totalPoints = 0;
    var totalSubpixelPoints = 0;
    var totalSamples = 0;
    
    for (var i = 0; i < maskData.length; i++) {
        for (var j = 0; j < maskData[i].points.length; j++) {
            var timeData = maskData[i].points[j];
            totalSamples++;
            for (var k = 0; k < timeData.points.length; k++) {
                totalPoints++;
                var point = timeData.points[k];
                if (point.isSubpixelX || point.isSubpixelY) {
                    totalSubpixelPoints++;
                }
            }
        }
    }
    
    // Add statistics section
    htmlContent += '    <div class="stats">\n' +
        '        <h3>Analysis Statistics</h3>\n' +
        '        <div class="stats-grid">\n' +
        '            <div class="stat-item">\n' +
        '                <div class="stat-number">' + maskData.length + '</div>\n' +
        '                <div class="stat-label">Total Masks</div>\n' +
        '            </div>\n' +
        '            <div class="stat-item">\n' +
        '                <div class="stat-number">' + sampleTimes.length + '</div>\n' +
        '                <div class="stat-label">Sample Times</div>\n' +
        '            </div>\n' +
        '            <div class="stat-item">\n' +
        '                <div class="stat-number">' + totalPoints + '</div>\n' +
        '                <div class="stat-label">Total Point Samples</div>\n' +
        '            </div>\n' +
        '            <div class="stat-item">\n' +
        '                <div class="stat-number">' + totalSubpixelPoints + '</div>\n' +
        '                <div class="stat-label">Subpixel Points</div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n\n';
    
    // Add legend
    htmlContent += '    <div class="legend">\n' +
        '        <h3>Legend</h3>\n' +
        '        <p><span class="color-indicator" style="background-color: #007bff;"></span><strong>Blue:</strong> Whole pixel coordinates</p>\n' +
        '        <p><span class="color-indicator" style="background-color: #dc3545;"></span><strong>Red:</strong> Subpixel coordinates (fractional values)</p>\n' +
        '    </div>\n\n';
    
    // Generate mask sections
    for (var maskIndex = 0; maskIndex < maskData.length; maskIndex++) {
        var mask = maskData[maskIndex];
        
        htmlContent += '    <div class="mask-section">\n' +
            '        <div class="mask-header">\n' +
            '            Layer: ' + mask.layerName + ' | Mask: ' + mask.maskName + '\n' +
            '        </div>\n';
        
        for (var timeIndex = 0; timeIndex < mask.points.length; timeIndex++) {
            var timeData = mask.points[timeIndex];
            
            htmlContent += '        <div class="time-section">\n' +
                '            <div class="time-header">\n' +
                '                ' + formatTime(timeData.time, comp.frameRate) + '\n' +
                '            </div>\n' +
                '            <div class="points-grid">\n';
            
            for (var pointIndex = 0; pointIndex < timeData.points.length; pointIndex++) {
                var point = timeData.points[pointIndex];
                var xClass = point.isSubpixelX ? 'subpixel' : 'whole-pixel';
                var yClass = point.isSubpixelY ? 'subpixel' : 'whole-pixel';
                
                htmlContent += '                <div class="point-card">\n' +
                    '                    <div class="point-index">Point ' + point.index + '</div>\n' +
                    '                    <div class="coordinate">X: <span class="' + xClass + '">' + formatCoordinate(point.x) + '</span></div>\n' +
                    '                    <div class="coordinate">Y: <span class="' + yClass + '">' + formatCoordinate(point.y) + '</span></div>\n' +
                    '                </div>\n';
            }
            
            htmlContent += '            </div>\n' +
                '        </div>\n';
        }
        
        htmlContent += '    </div>\n\n';
    }
    
    htmlContent += '</body>\n</html>';
    
    // Save the HTML file
    var projectFile = app.project.file;
    var projectFolder = projectFile ? projectFile.parent : Folder.desktop;
    var fileName = comp.name.replace(/[^a-zA-Z0-9]/g, '_') + '_mask_analysis.html';
    var htmlFile = new File(projectFolder.fsName + '/' + fileName);
    
    htmlFile.open('w');
    htmlFile.write(htmlContent);
    htmlFile.close();
    
    // Launch the webpage
    try {
        htmlFile.execute();
        alert("Mask analysis complete!\n\n" +
              "Statistics:\n" +
              "• Total masks analyzed: " + maskData.length + "\n" +
              "• Sample times: " + sampleTimes.length + "\n" +
              "• Total point samples: " + totalPoints + "\n" +
              "• Subpixel points found: " + totalSubpixelPoints + "\n\n" +
              "HTML file saved and opened:\n" + htmlFile.fsName);
    } catch (error) {
        alert("Mask analysis complete!\n\n" +
              "HTML file saved to:\n" + htmlFile.fsName + "\n\n" +
              "Please open the file manually to view the results.\n" +
              "(Auto-launch failed: " + error.toString() + ")");
    }
    
})();