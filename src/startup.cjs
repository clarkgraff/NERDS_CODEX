'use strict';
const projects=require('./projects.cjs');
// Saved project files are never changed. Retain recovery explicitly, never activate it.
function blankStart(store){
 const previous=store.read(),snapshot=projects.snapshot(store),blank=projects.blank();
 if(previous.waypoints.length||snapshot.media.length||snapshot.research.length)store.put('previousSessionRecovery',snapshot);
 blank.state.vessel={...previous.vessel,referenceKnots:6};
 blank.state.mapPresentation=previous.mapPresentation;
 blank.state.overlays=previous.overlays;
 projects.replace(store,blank);store.put('project',{path:null,dirty:false});
 return store.read();
}
module.exports={blankStart};
