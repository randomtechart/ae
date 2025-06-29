(function() {
   app.beginUndoGroup("Adjust Image Layer Start Times");

   var comp = app.project.activeItem;
   if (!comp || !(comp instanceof CompItem)) {
       alert("Please select a composition first.");
       return;
   }

   // Process all selected layers, or all layers if none are selected
   var layers = comp.selectedLayers.length > 0 ? comp.selectedLayers : comp.layers;

   for (var i = 0; i < layers.length; i++) {
       var layer = layers[i];

       // Only process image/still layers (not checking file extension,
       // instead checking if source is AVItem but not FootageItem.mainSource.isStill)
       if (layer.source instanceof AVItem &&
           (layer.source instanceof CompItem ||
           (layer.source.mainSource && layer.source.mainSource.isStill))) {

           // Check if start time doesn't match in point
           if (layer.startTime !== layer.inPoint) {
               // Store the layer's duration
               var layerDuration = layer.outPoint - layer.inPoint;

               // Calculate the offset (how much we need to shift)
               var timeOffset = layer.inPoint - layer.startTime;

               // Store all property groups with keyframes
               var propertiesToShift = [];
               collectPropertiesWithKeyframes(layer, propertiesToShift);

               // Set the new start time to match in point
               layer.startTime = layer.inPoint;

               // Set the new out point to maintain duration
               layer.outPoint = layer.inPoint + layerDuration;

               // Shift all keyframes by the same offset
               for (var j = 0; j < propertiesToShift.length; j++) {
                   shiftKeyframes(propertiesToShift[j], timeOffset);
               }
           }
       }
   }

   app.endUndoGroup();

   // Recursive function to collect all properties with keyframes
   function collectPropertiesWithKeyframes(propertyGroup, collection) {
       for (var i = 1; i <= propertyGroup.numProperties; i++) {
           var prop = propertyGroup.property(i);

           if (prop.propertyType === PropertyType.PROPERTY) {
               // This is an actual property
               if (prop.numKeys > 0) {
                   collection.push(prop);
               }
           } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                     prop.propertyType === PropertyType.NAMED_GROUP) {
               // This is a property group, so we need to dig deeper
               collectPropertiesWithKeyframes(prop, collection);
           }
       }
   }

   // Function to shift all keyframes in a property
   function shiftKeyframes(property, timeOffset) {
       // We need to work backwards to avoid changing keyframe indices
       for (var i = property.numKeys; i >= 1; i--) {
           var keyTime = property.keyTime(i);
           var keyValue = property.keyValue(i);

           // Get keyframe ease/interpolation settings
           var inInterpolationType = property.keyInInterpolationType(i);
           var outInterpolationType = property.keyOutInterpolationType(i);
           var inTemporalEase = property.keyInTemporalEase(i);
           var outTemporalEase = property.keyOutTemporalEase(i);

           // Remove existing keyframe
           property.removeKey(i);

           // Add keyframe at new time with same value and settings
           var newKeyIndex = property.addKey(keyTime + timeOffset);
           property.setValueAtKey(newKeyIndex, keyValue);

           // Restore interpolation types
           property.setTemporalEaseAtKey(newKeyIndex, inTemporalEase, outTemporalEase);
           property.setInterpolationTypeAtKey(newKeyIndex, inInterpolationType, outInterpolationType);
       }
   }
})();