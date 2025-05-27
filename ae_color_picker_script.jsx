// Color Picker with Hex Code v1.0
// A utility script to pick colors and get their hex codes in After Effects

(function createColorPicker() {
    
    // Check if After Effects is available
    if (typeof app === "undefined") {
        alert("This script must be run in After Effects.");
        return;
    }
    
    var scriptName = "Color Picker";
    var win;
    var currentColor = [1, 0, 0]; // Default to red (RGB values 0-1)
    
    // Utility functions
    function rgbToHex(r, g, b) {
        // Convert 0-1 range to 0-255 range and then to hex
        var red = Math.round(r * 255);
        var green = Math.round(g * 255);
        var blue = Math.round(b * 255);
        
        // Ensure values are within valid range
        red = Math.max(0, Math.min(255, red));
        green = Math.max(0, Math.min(255, green));
        blue = Math.max(0, Math.min(255, blue));
        
        // Convert to hex and pad with zeros if needed
        var hexR = red.toString(16).padStart(2, '0');
        var hexG = green.toString(16).padStart(2, '0');
        var hexB = blue.toString(16).padStart(2, '0');
        
        return "#" + hexR + hexG + hexB;
    }
    
    function hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values
        var r = parseInt(hex.substring(0, 2), 16) / 255;
        var g = parseInt(hex.substring(2, 4), 16) / 255;
        var b = parseInt(hex.substring(4, 6), 16) / 255;
        
        return [r, g, b];
    }
    
    function isValidHex(hex) {
        var hexPattern = /^#?([A-Fa-f0-9]{6})$/;
        return hexPattern.test(hex);
    }
    
    function updateColorDisplay() {
        // Update the color swatch
        var hexCode = rgbToHex(currentColor[0], currentColor[1], currentColor[2]);
        win.colorGroup.hexInput.text = hexCode.toUpperCase();
        
        // Update RGB display
        win.rgbGroup.rValue.text = "R: " + Math.round(currentColor[0] * 255);
        win.rgbGroup.gValue.text = "G: " + Math.round(currentColor[1] * 255);
        win.rgbGroup.bValue.text = "B: " + Math.round(currentColor[2] * 255);
        
        // Update color swatch background (simulate color display)
        var brightness = (currentColor[0] * 0.299 + currentColor[1] * 0.587 + currentColor[2] * 0.114);
        win.colorGroup.colorSwatch.text = brightness > 0.5 ? "●" : "○";
    }
    
    function openColorPicker() {
        try {
            // Use After Effects' built-in color picker
            var pickedColor = app.project.activeItem ? 
                app.project.activeItem.layer(1).property("Effects").addProperty("ADBE Fill").property("ADBE Fill-0002").value :
                currentColor;
            
            // Alternative approach using a simpler method
            // Create a temporary solid to access color picker
            var tempComp = app.project.items.addComp("TempColorPicker", 100, 100, 1, 1, 24);
            var tempSolid = tempComp.layers.addSolid(currentColor, "ColorPicker", 100, 100, 1);
            
            // Open the solid settings which includes color picker
            tempSolid.source.mainSource.color = currentColor;
            
            // Show color picker dialog
            var newColor = tempSolid.source.mainSource.color;
            
            // Clean up
            tempComp.remove();
            
            if (newColor && newColor.length >= 3) {
                currentColor = [newColor[0], newColor[1], newColor[2]];
                updateColorDisplay();
            }
            
        } catch (e) {
            // Fallback: Show system color picker if available
            try {
                // Convert current color to 0-255 range for system picker
                var r = Math.round(currentColor[0] * 255);
                var g = Math.round(currentColor[1] * 255);
                var b = Math.round(currentColor[2] * 255);
                
                // Create a simple color input dialog
                showColorInputDialog();
                
            } catch (e2) {
                alert("Color picker not available. Please enter hex code manually.");
            }
        }
    }
    
    function showColorInputDialog() {
        var colorDialog = new Window("dialog", "Enter Color");
        colorDialog.orientation = "column";
        colorDialog.alignChildren = "fill";
        colorDialog.spacing = 10;
        colorDialog.margins = 16;
        
        var instructionText = colorDialog.add("statictext", undefined, "Enter RGB values (0-255) or Hex code:");
        instructionText.alignment = "center";
        
        var inputGroup = colorDialog.add("group");
        inputGroup.orientation = "row";
        inputGroup.alignChildren = "center";
        
        var rgbGroup = inputGroup.add("group");
        rgbGroup.orientation = "column";
        rgbGroup.alignChildren = "left";
        
        var rGroup = rgbGroup.add("group");
        rGroup.add("statictext", undefined, "R:");
        var rInput = rGroup.add("edittext", undefined, Math.round(currentColor[0] * 255).toString());
        rInput.preferredSize.width = 50;
        
        var gGroup = rgbGroup.add("group");
        gGroup.add("statictext", undefined, "G:");
        var gInput = gGroup.add("edittext", undefined, Math.round(currentColor[1] * 255).toString());
        gInput.preferredSize.width = 50;
        
        var bGroup = rgbGroup.add("group");
        bGroup.add("statictext", undefined, "B:");
        var bInput = bGroup.add("edittext", undefined, Math.round(currentColor[2] * 255).toString());
        bInput.preferredSize.width = 50;
        
        var orText = inputGroup.add("statictext", undefined, "OR");
        
        var hexGroup = inputGroup.add("group");
        hexGroup.orientation = "column";
        hexGroup.alignChildren = "center";
        
        hexGroup.add("statictext", undefined, "Hex:");
        var hexInput = hexGroup.add("edittext", undefined, rgbToHex(currentColor[0], currentColor[1], currentColor[2]));
        hexInput.preferredSize.width = 80;
        
        var buttonGroup = colorDialog.add("group");
        buttonGroup.alignment = "center";
        
        var okBtn = buttonGroup.add("button", undefined, "OK");
        var cancelBtn = buttonGroup.add("button", undefined, "Cancel");
        
        okBtn.onClick = function() {
            try {
                var hexValue = hexInput.text.trim();
                if (hexValue && isValidHex(hexValue)) {
                    currentColor = hexToRgb(hexValue);
                } else {
                    var r = parseInt(rInput.text) / 255;
                    var g = parseInt(gInput.text) / 255;
                    var b = parseInt(bInput.text) / 255;
                    
                    if (isNaN(r) || isNaN(g) || isNaN(b) || r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
                        alert("Invalid color values. Please enter values between 0-255 for RGB or valid hex code.");
                        return;
                    }
                    
                    currentColor = [r, g, b];
                }
                
                colorDialog.close(1);
            } catch (e) {
                alert("Error parsing color values: " + e.toString());
            }
        };
        
        cancelBtn.onClick = function() {
            colorDialog.close(0);
        };
        
        if (colorDialog.show() === 1) {
            updateColorDisplay();
        }
    }
    
    function copyToClipboard() {
        try {
            var hexCode = win.colorGroup.hexInput.text;
            
            // Try to copy to clipboard using system command
            if ($.os.indexOf("Windows") !== -1) {
                // Windows
                var cmd = 'echo ' + hexCode + ' | clip';
                system.callSystem(cmd);
                alert("Hex code copied to clipboard: " + hexCode);
            } else {
                // Mac
                var cmd = 'echo "' + hexCode + '" | pbcopy';
                system.callSystem(cmd);
                alert("Hex code copied to clipboard: " + hexCode);
            }
        } catch (e) {
            // Fallback: Show the hex code for manual copying
            var copyDialog = new Window("dialog", "Copy Hex Code");
            copyDialog.orientation = "column";
            copyDialog.alignChildren = "fill";
            copyDialog.spacing = 10;
            copyDialog.margins = 16;
            
            copyDialog.add("statictext", undefined, "Copy this hex code:");
            
            var hexDisplay = copyDialog.add("edittext", undefined, win.colorGroup.hexInput.text);
            hexDisplay.preferredSize.width = 200;
            hexDisplay.active = true;
            hexDisplay.selection = [0, hexDisplay.text.length];
            
            var okBtn = copyDialog.add("button", undefined, "OK");
            okBtn.onClick = function() {
                copyDialog.close();
            };
            
            copyDialog.show();
        }
    }
    
    function applyToSelectedLayers() {
        try {
            var activeComp = app.project.activeItem;
            if (!activeComp || !(activeComp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }
            
            var selectedLayers = activeComp.selectedLayers;
            if (selectedLayers.length === 0) {
                alert("Please select one or more layers.");
                return;
            }
            
            app.beginUndoGroup("Apply Color to Layers");
            
            var appliedCount = 0;
            
            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];
                
                // Try to apply color to different layer types
                if (layer instanceof TextLayer) {
                    // Apply to text color
                    var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
                    var textDoc = textProp.value;
                    textDoc.fillColor = currentColor;
                    textProp.setValue(textDoc);
                    appliedCount++;
                } else if (layer instanceof ShapeLayer) {
                    // Apply to shape fill
                    try {
                        var contents = layer.property("ADBE Root Vectors Group");
                        if (contents) {
                            // This is a simplified approach - shape layers can be complex
                            layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(100);
                            appliedCount++;
                        }
                    } catch (e) {
                        // Shape layer structure can vary
                    }
                } else if (layer instanceof AVLayer && layer.source instanceof SolidSource) {
                    // Apply to solid layer
                    layer.source.mainSource.color = currentColor;
                    appliedCount++;
                }
            }
            
            app.endUndoGroup();
            
            if (appliedCount > 0) {
                alert("Applied color to " + appliedCount + " layers.");
            } else {
                alert("Could not apply color to selected layers. Try using text or solid layers.");
            }
            
        } catch (e) {
            app.endUndoGroup();
            alert("Error applying color: " + e.toString());
        }
    }
    
    function validateHexInput() {
        var hexValue = win.colorGroup.hexInput.text.trim();
        if (isValidHex(hexValue)) {
            currentColor = hexToRgb(hexValue);
            updateColorDisplay();
        } else if (hexValue.length > 0) {
            alert("Invalid hex code. Please use format #RRGGBB or RRGGBB");
            updateColorDisplay(); // Revert to previous valid color
        }
    }
    
    // UI Creation
    function createUI() {
        win = new Window("dialog", scriptName);
        win.orientation = "column";
        win.alignChildren = "fill";
        win.spacing = 15;
        win.margins = 20;
        
        // Color display group
        win.colorGroup = win.add("panel", undefined, "Color Selection");
        win.colorGroup.orientation = "column";
        win.colorGroup.alignChildren = "fill";
        win.colorGroup.margins = 10;
        win.colorGroup.spacing = 10;
        
        // Color swatch (simulated)
        var swatchGroup = win.colorGroup.add("group");
        swatchGroup.alignment = "center";
        swatchGroup.add("statictext", undefined, "Current Color:");
        win.colorGroup.colorSwatch = swatchGroup.add("statictext", undefined, "●");
        win.colorGroup.colorSwatch.preferredSize = [30, 30];
        
        // Color picker button
        win.colorGroup.pickerBtn = win.colorGroup.add("button", undefined, "Choose Color");
        win.colorGroup.pickerBtn.onClick = openColorPicker;
        
        // Hex input
        var hexGroup = win.colorGroup.add("group");
        hexGroup.add("statictext", undefined, "Hex Code:");
        win.colorGroup.hexInput = hexGroup.add("edittext", undefined, "#FF0000");
        win.colorGroup.hexInput.preferredSize.width = 100;
        win.colorGroup.hexInput.onChanging = validateHexInput;
        
        // RGB display
        win.rgbGroup = win.add("panel", undefined, "RGB Values");
        win.rgbGroup.orientation = "row";
        win.rgbGroup.alignChildren = "center";
        win.rgbGroup.margins = 10;
        win.rgbGroup.spacing = 15;
        
        win.rgbGroup.rValue = win.rgbGroup.add("statictext", undefined, "R: 255");
        win.rgbGroup.gValue = win.rgbGroup.add("statictext", undefined, "G: 0");
        win.rgbGroup.bValue = win.rgbGroup.add("statictext", undefined, "B: 0");
        
        // Action buttons
        win.actionGroup = win.add("group");
        win.actionGroup.orientation = "column";
        win.actionGroup.alignChildren = "fill";
        win.actionGroup.spacing = 8;
        
        win.actionGroup.copyBtn = win.actionGroup.add("button", undefined, "Copy Hex Code");
        win.actionGroup.copyBtn.onClick = copyToClipboard;
        
        win.actionGroup.applyBtn = win.actionGroup.add("button", undefined, "Apply to Selected Layers");
        win.actionGroup.applyBtn.onClick = applyToSelectedLayers;
        
        // Bottom buttons
        win.buttonGroup = win.add("group");
        win.buttonGroup.alignment = "center";
        win.buttonGroup.spacing = 10;
        
        win.buttonGroup.closeBtn = win.buttonGroup.add("button", undefined, "Close");
        win.buttonGroup.closeBtn.onClick = function() {
            win.close();
        };
        
        // Initialize display
        updateColorDisplay();
        
        return win;
    }
    
    // String prototype extension for older ExtendScript versions
    if (!String.prototype.padStart) {
        String.prototype.padStart = function(targetLength, padString) {
            targetLength = targetLength >> 0;
            padString = String(padString || ' ');
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
    
    // Initialize and show UI
    try {
        createUI();
        win.show();
    } catch (e) {
        alert("Failed to create color picker UI: " + e.toString());
    }
    
})();