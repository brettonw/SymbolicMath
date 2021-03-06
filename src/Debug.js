// an implementation of a debug function, later it would be cool to add the 
// ability to use levels (TRACE, DEBUG, INFO, ERROR)
//------------------------------------------------------------------------------
var DEBUG_LEVEL = { TRC: 0, DBG: 1, INF: 2, ERR: 3, SLN: 4 }
var globalDebugLevel = DEBUG_LEVEL.DBG;
function debugOut(from, msg) {
    var output = from + ": " + msg;
    var debugDiv = document.getElementById("debugOut");
    if (debugDiv != null) {
        debugDiv.innerHTML += from + ": " + msg + "<br />\n";
    }
    console.log(output);
}

#define	DEBUG_OUT(level, from, msg)								                \
    if (level >= globalDebugLevel) { debugOut (from, msg); }
