// After Effects Composition Analyzer
// Recursively analyzes compositions and generates HTML report

(function() {
    "use strict";
    
    // Check if a composition is active
    if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please select an active composition.");
        return;
    }
    
    var rootComp = app.project.activeItem;
    var analysisData = [];
    var processedComps = {}; // Track processed comps to avoid infinite loops
    
    // Utility function to format time as timecode
    function formatTime(seconds, frameRate) {
        if (seconds < 0) return "0:00:00:00";
        
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = Math.floor(seconds % 60);
        var frames = Math.floor((seconds % 1) * frameRate);
        
        return hours + ":" + 
               (minutes < 10 ? "0" : "") + minutes + ":" +
               (secs < 10 ? "0" : "") + secs + ":" +
               (frames < 10 ? "0" : "") + frames;
    }
    
    // Function to escape HTML characters
    function escapeHtml(text) {
        if (typeof text !== 'string') return text;
        return text.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#x27;');
    }
    
    // Function to get composition markers
    function getCompMarkers(comp) {
        var markers = [];
        for (var i = 1; i <= comp.markerProperty.numKeys; i++) {
            var time = comp.markerProperty.keyTime(i);
            var markerValue = comp.markerProperty.keyValue(i);
            
            markers.push({
                time: time,
                timecode: formatTime(time, comp.frameRate),
                comment: markerValue.comment || "",
                chapter: markerValue.chapter || "",
                url: markerValue.url || "",
                frameTarget: markerValue.frameTarget || "",
                cuePointName: markerValue.cuePointName || ""
            });
        }
        return markers;
    }
    
    // Function to get layer markers
    function getLayerMarkers(layer) {
        var markers = [];
        
        try {
            if (layer.property("Marker")) {
                var markerProp = layer.property("Marker");
                for (var i = 1; i <= markerProp.numKeys; i++) {
                    var time = markerProp.keyTime(i);
                    var markerValue = markerProp.keyValue(i);
                    
                    markers.push({
                        time: time,
                        timecode: formatTime(time, layer.containingComp.frameRate),
                        comment: markerValue.comment || "",
                        chapter: markerValue.chapter || "",
                        url: markerValue.url || "",
                        frameTarget: markerValue.frameTarget || "",
                        cuePointName: markerValue.cuePointName || ""
                    });
                }
            }
        } catch (e) {
            // Layer doesn't support markers or other error
        }
        
        return markers;
    }
    
    // Function to analyze a layer
    function analyzeLayer(layer, compPath) {
        var layerData = {
            index: layer.index,
            name: layer.name,
            type: "",
            enabled: layer.enabled,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            startTime: layer.startTime,
            inPointTimecode: formatTime(layer.inPoint, layer.containingComp.frameRate),
            outPointTimecode: formatTime(layer.outPoint, layer.containingComp.frameRate),
            startTimeTimecode: formatTime(layer.startTime, layer.containingComp.frameRate),
            markers: getLayerMarkers(layer),
            isPrecomp: false,
            precompPath: ""
        };
        
        // Determine layer type
        if (layer instanceof AVLayer) {
            if (layer.source instanceof CompItem) {
                layerData.type = "Pre-composition";
                layerData.isPrecomp = true;
                layerData.precompPath = compPath + " > " + layer.source.name;
                layerData.sourceName = layer.source.name;
            } else if (layer.source instanceof FootageItem) {
                layerData.type = "Footage";
                layerData.sourceName = layer.source.name;
            } else {
                layerData.type = "Solid/Other";
            }
        } else if (layer instanceof ShapeLayer) {
            layerData.type = "Shape Layer";
        } else if (layer instanceof TextLayer) {
            layerData.type = "Text Layer";
        } else if (layer instanceof CameraLayer) {
            layerData.type = "Camera";
        } else if (layer instanceof LightLayer) {
            layerData.type = "Light";
        } else {
            layerData.type = "Unknown";
        }
        
        return layerData;
    }
    
    // Recursive function to analyze composition
    function analyzeComposition(comp, path) {
        path = path || comp.name;
        
        // Avoid infinite loops with circular references
        if (processedComps[comp.id]) {
            return;
        }
        processedComps[comp.id] = true;
        
        var compData = {
            name: comp.name,
            path: path,
            duration: comp.duration,
            frameRate: comp.frameRate,
            width: comp.width,
            height: comp.height,
            pixelAspect: comp.pixelAspectRatio,
            durationTimecode: formatTime(comp.duration, comp.frameRate),
            markers: getCompMarkers(comp),
            layers: []
        };
        
        // Analyze each layer
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var layerData = analyzeLayer(layer, path);
            compData.layers.push(layerData);
            
            // If this layer is a precomp, analyze it recursively
            if (layerData.isPrecomp && layer.source instanceof CompItem) {
                analyzeComposition(layer.source, layerData.precompPath);
            }
        }
        
        analysisData.push(compData);
    }
    
    // Start analysis
    app.beginUndoGroup("Analyze Compositions");
    
    try {
        analyzeComposition(rootComp);
        
        // Generate HTML report
        var html = generateHTMLReport();
        
        // Save HTML file
        var htmlFile = new File(Folder.desktop + "/AE_Composition_Analysis_" + 
                               new Date().getTime() + ".html");
        
        if (htmlFile.open("w")) {
            htmlFile.write(html);
            htmlFile.close();
            
            // Launch the HTML file
            htmlFile.execute();
            
            alert("Analysis complete! HTML report generated and opened:\n" + htmlFile.fsName);
        } else {
            alert("Error: Could not create HTML file.");
        }
        
    } catch (error) {
        alert("Error during analysis: " + error.toString());
    } finally {
        app.endUndoGroup();
    }
    
    // Function to generate HTML report
    function generateHTMLReport() {
        var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
            '<meta charset="UTF-8">\n' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '<title>After Effects Composition Analysis</title>\n' +
            '<style>\n' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }\n' +
            '.container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }\n' +
            '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }\n' +
            '.header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }\n' +
            '.header p { margin: 10px 0 0 0; opacity: 0.9; }\n' +
            '.content { padding: 30px; }\n' +
            '.comp-section { margin-bottom: 40px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }\n' +
            '.comp-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e0e0e0; }\n' +
            '.comp-title { font-size: 1.4em; font-weight: 600; color: #333; margin: 0 0 10px 0; }\n' +
            '.comp-path { font-family: Monaco, "Lucida Console", monospace; background: #e9ecef; padding: 8px 12px; border-radius: 4px; font-size: 0.9em; color: #495057; }\n' +
            '.comp-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }\n' +
            '.info-item { background: white; padding: 12px; border-radius: 4px; border: 1px solid #dee2e6; }\n' +
            '.info-label { font-weight: 600; color: #6c757d; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
            '.info-value { font-size: 1.1em; color: #212529; margin-top: 4px; }\n' +
            '.markers-section, .layers-section { padding: 20px; }\n' +
            '.section-title { font-size: 1.2em; font-weight: 600; color: #495057; margin: 0 0 15px 0; display: flex; align-items: center; }\n' +
            '.marker-badge, .layer-badge { background: #007bff; color: white; border-radius: 12px; padding: 2px 8px; font-size: 0.8em; margin-left: 10px; }\n' +
            '.layer-badge { background: #28a745; }\n' +
            '.markers-grid { display: grid; gap: 12px; }\n' +
            '.marker-item { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; }\n' +
            '.marker-time { font-weight: 600; color: #856404; font-family: Monaco, monospace; }\n' +
            '.marker-comment { margin-top: 6px; color: #856404; }\n' +
            '.layers-grid { display: grid; gap: 8px; }\n' +
            '.layer-item { background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; transition: box-shadow 0.2s; }\n' +
            '.layer-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\n' +
            '.layer-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }\n' +
            '.layer-name { font-weight: 600; color: #212529; }\n' +
            '.layer-type { background: #6c757d; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 10px; }\n' +
            '.precomp-type { background: #17a2b8; }\n' +
            '.layer-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 0.9em; color: #6c757d; }\n' +
            '.layer-markers { margin-top: 15px; }\n' +
            '.layer-marker-item { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 8px; margin-top: 6px; }\n' +
            '.no-markers { color: #6c757d; font-style: italic; text-align: center; padding: 20px; }\n' +
            '.disabled-layer { opacity: 0.6; }\n' +
            '.summary { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 20px; margin-bottom: 30px; }\n' +
            '.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center; }\n' +
            '.summary-item { background: white; padding: 15px; border-radius: 6px; }\n' +
            '.summary-number { font-size: 2em; font-weight: 600; color: #007bff; margin-bottom: 5px; }\n' +
            '.summary-label { color: #6c757d; font-size: 0.9em; }\n' +
            '</style>\n</head>\n<body>\n';
        
        html += '<div class="container">\n';
        html += '<div class="header">\n';
        html += '<h1>Composition Analysis Report</h1>\n';
        html += '<p>Generated on ' + new Date().toLocaleString() + '</p>\n';
        html += '</div>\n';
        
        html += '<div class="content">\n';
        
        // Generate summary
        var totalComps = analysisData.length;
        var totalLayers = 0;
        var totalCompMarkers = 0;
        var totalLayerMarkers = 0;
        
        for (var i = 0; i < analysisData.length; i++) {
            totalLayers += analysisData[i].layers.length;
            totalCompMarkers += analysisData[i].markers.length;
            for (var j = 0; j < analysisData[i].layers.length; j++) {
                totalLayerMarkers += analysisData[i].layers[j].markers.length;
            }
        }
        
        html += '<div class="summary">\n';
        html += '<div class="summary-grid">\n';
        html += '<div class="summary-item"><div class="summary-number">' + totalComps + '</div><div class="summary-label">Compositions</div></div>\n';
        html += '<div class="summary-item"><div class="summary-number">' + totalLayers + '</div><div class="summary-label">Total Layers</div></div>\n';
        html += '<div class="summary-item"><div class="summary-number">' + totalCompMarkers + '</div><div class="summary-label">Comp Markers</div></div>\n';
        html += '<div class="summary-item"><div class="summary-number">' + totalLayerMarkers + '</div><div class="summary-label">Layer Markers</div></div>\n';
        html += '</div>\n</div>\n';
        
        // Generate composition sections
        for (var i = 0; i < analysisData.length; i++) {
            var comp = analysisData[i];
            
            html += '<div class="comp-section">\n';
            html += '<div class="comp-header">\n';
            html += '<h2 class="comp-title">' + escapeHtml(comp.name) + '</h2>\n';
            html += '<div class="comp-path">' + escapeHtml(comp.path) + '</div>\n';
            
            html += '<div class="comp-info">\n';
            html += '<div class="info-item"><div class="info-label">Duration</div><div class="info-value">' + comp.durationTimecode + '</div></div>\n';
            html += '<div class="info-item"><div class="info-label">Frame Rate</div><div class="info-value">' + comp.frameRate + ' fps</div></div>\n';
            html += '<div class="info-item"><div class="info-label">Resolution</div><div class="info-value">' + comp.width + ' × ' + comp.height + '</div></div>\n';
            html += '<div class="info-item"><div class="info-label">Pixel Aspect</div><div class="info-value">' + comp.pixelAspect.toFixed(2) + '</div></div>\n';
            html += '</div>\n';
            html += '</div>\n';
            
            // Composition markers
            html += '<div class="markers-section">\n';
            html += '<h3 class="section-title">Composition Markers<span class="marker-badge">' + comp.markers.length + '</span></h3>\n';
            
            if (comp.markers.length > 0) {
                html += '<div class="markers-grid">\n';
                for (var j = 0; j < comp.markers.length; j++) {
                    var marker = comp.markers[j];
                    html += '<div class="marker-item">\n';
                    html += '<div class="marker-time">' + marker.timecode + '</div>\n';
                    if (marker.comment) {
                        html += '<div class="marker-comment">' + escapeHtml(marker.comment) + '</div>\n';
                    }
                    html += '</div>\n';
                }
                html += '</div>\n';
            } else {
                html += '<div class="no-markers">No composition markers found</div>\n';
            }
            html += '</div>\n';
            
            // Layers
            html += '<div class="layers-section">\n';
            html += '<h3 class="section-title">Layers<span class="layer-badge">' + comp.layers.length + '</span></h3>\n';
            
            html += '<div class="layers-grid">\n';
            for (var k = 0; k < comp.layers.length; k++) {
                var layer = comp.layers[k];
                var layerClass = layer.enabled ? "layer-item" : "layer-item disabled-layer";
                
                html += '<div class="' + layerClass + '">\n';
                html += '<div class="layer-header">\n';
                html += '<span class="layer-name">' + layer.index + '. ' + escapeHtml(layer.name) + '</span>\n';
                var typeClass = layer.isPrecomp ? "layer-type precomp-type" : "layer-type";
                html += '<span class="' + typeClass + '">' + layer.type + '</span>\n';
                html += '</div>\n';
                
                html += '<div class="layer-details">\n';
                html += '<div><strong>In:</strong> ' + layer.inPointTimecode + '</div>\n';
                html += '<div><strong>Out:</strong> ' + layer.outPointTimecode + '</div>\n';
                html += '<div><strong>Start:</strong> ' + layer.startTimeTimecode + '</div>\n';
                html += '<div><strong>Enabled:</strong> ' + (layer.enabled ? "Yes" : "No") + '</div>\n';
                html += '</div>\n';
                
                if (layer.markers.length > 0) {
                    html += '<div class="layer-markers">\n';
                    html += '<strong>Layer Markers (' + layer.markers.length + '):</strong>\n';
                    for (var m = 0; m < layer.markers.length; m++) {
                        var layerMarker = layer.markers[m];
                        html += '<div class="layer-marker-item">\n';
                        html += '<strong>' + layerMarker.timecode + '</strong>\n';
                        if (layerMarker.comment) {
                            html += ' - ' + escapeHtml(layerMarker.comment);
                        }
                        html += '</div>\n';
                    }
                    html += '</div>\n';
                }
                
                html += '</div>\n';
            }
            html += '</div>\n';
            html += '</div>\n';
            html += '</div>\n';
        }
        
        html += '</div>\n</div>\n</body>\n</html>';
        
        return html;
    }
    
})();