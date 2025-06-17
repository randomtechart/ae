// Create temp comp
var comp = app.project.items.addComp(“render_check”, 1920, 1080, 1, 1, 30);

// Add to render queue
var rqItem = app.project.renderQueue.items.add(comp);

// Check if output template exists (replace “YourTemplateName” with actual template name)
var templateExists = false;
var templateName = “YourTemplateName”; // Change this to your template name

try {
rqItem.outputModule(1).applyTemplate(templateName);
templateExists = true;
alert(“Template ‘” + templateName + “’ exists!”);
} catch (e) {
alert(“Template ‘” + templateName + “’ not found!”);
}

// Cleanup
rqItem.remove();
comp.remove();