// an implementation of a debug function, later it would be cool to add the 
// ability to use levels (TRACE, DEBUG, INFO, ERROR)
//------------------------------------------------------------------------------
var DEBUG_LEVEL = { TRC: 0, DBG: 1, INF: 2, ERR: 3, SLN: 4 }
var globalDebugLevel = DEBUG_LEVEL.DBG;
function debugOut(level, from, msg) {
    if (level >= globalDebugLevel) {
        var debugDiv = document.getElementById("debugOut");
        if (debugDiv != null) {
            debugDiv.innerHTML += from + ": " + msg + "<br />\n";
        }
    }
}