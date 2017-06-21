// Credits to https://github.com/forrestthewoods/lib_fts/blob/master/code/fts_fuzzy_match.js with some modifications

var FuzzySearchModule = function() {

    // Score consts
    this.adjacency_bonus = 5;                // bonus for adjacent matches
    this.separator_bonus = 10;               // bonus if match occurs after a separator
    this.camel_bonus = 10;                   // bonus if match is uppercase and prev is lower
    this.leading_letter_penalty = -3;        // penalty applied for every letter in str before the first match
    this.max_leading_letter_penalty = -9;    // maximum penalty for leading letters
    this.unmatched_letter_penalty = -1;      // penalty for every letter that doesn't matter
}

// Returns [bool, score, formattedStr]
// bool: true if each character in pattern is found sequentially within str
// score: integer; higher is better match. Value has no intrinsic meaning. Range varies with pattern. 
//        Can only compare scores with same search pattern.
// formattedStr: input str with matched characters marked in <b> tags. Delete if unwanted.
FuzzySearchModule.prototype.fuzzyMatch = function(pattern, str) {
   
    // Loop variables
    var score = 0;
    var patternIdx = 0;
    var patternLength = pattern.length;
    var strIdx = 0;
    var strLength = str.length;
    var prevMatched = false;
    var prevLower = false;
    var prevSeparator = true;       // true so if first letter match gets separator bonus

    // Use "best" matched letter if multiple string letters match the pattern
    var bestLetter = null;
    var bestLower = null;
    var bestLetterIdx = null;
    var bestLetterScore = 0;

    var matchedIndices = [];

    // Loop over strings
    while (strIdx != strLength) {
        var patternChar = patternIdx != patternLength ? pattern.charAt(patternIdx) : null;
        var strChar = str.charAt(strIdx);

        var patternLower = patternChar != null ? patternChar.toLowerCase() : null;
        var strLower = strChar.toLowerCase();
        var strUpper = strChar.toUpperCase();

        var nextMatch = patternChar && patternLower == strLower;
        var rematch = bestLetter && bestLower == strLower;

        var advanced = nextMatch && bestLetter;
        var patternRepeat = bestLetter && patternChar && bestLower == patternLower;
        if (advanced || patternRepeat) {
            score += bestLetterScore;
            matchedIndices.push(bestLetterIdx);
            bestLetter = null;
            bestLower = null;
            bestLetterIdx = null;
            bestLetterScore = 0;
        }

        if (nextMatch || rematch) {
            var newScore = 0;

            // Apply penalty for each letter before the first pattern match
            // Note: std::max because penalties are negative values. So max is smallest penalty.
            if (patternIdx == 0) {
                var penalty = Math.max(strIdx * this.leading_letter_penalty, this.max_leading_letter_penalty);
                score += penalty;
            }

            // Apply bonus for consecutive bonuses
            if (prevMatched)
                newScore += this.adjacency_bonus;

            // Apply bonus for matches after a separator
            if (prevSeparator)
                newScore += this.separator_bonus;

            // Apply bonus across camel case boundaries. Includes "clever" isLetter check.
            if (prevLower && strChar == strUpper && strLower != strUpper)
                newScore += this.camel_bonus;

            // Update patter index IFF the next pattern letter was matched
            if (nextMatch)
                ++patternIdx;

            // Update best letter in str which may be for a "next" letter or a "rematch"
            if (newScore >= bestLetterScore) {

                // Apply penalty for now skipped letter
                if (bestLetter != null)
                    score += this.unmatched_letter_penalty;

                bestLetter = strChar;
                bestLower = bestLetter.toLowerCase();
                bestLetterIdx = strIdx;
                bestLetterScore = newScore;
            }

            prevMatched = true;
        }
        else {
            // Append unmatch characters
            formattedStr += strChar;

            score += this.unmatched_letter_penalty;
            prevMatched = false;
        }

        // Includes "clever" isLetter check.
        prevLower = strChar == strLower && strLower != strUpper;
        prevSeparator = strChar == '_' || strChar == ' ';

        ++strIdx;
    }

    // Apply score for last match
    if (bestLetter) {
        score += bestLetterScore;
        matchedIndices.push(bestLetterIdx);
    }

    // Finish out formatted string after last pattern matched
    // Build formated string based on matched letters
    var formattedStr = "";
    var lastIdx = 0;
    for (var i = 0; i < matchedIndices.length; ++i) {
        var idx = matchedIndices[i];
        formattedStr += str.substr(lastIdx, idx - lastIdx) + "<b>" + str.charAt(idx) + "</b>";
        lastIdx = idx + 1;
    }
    formattedStr += str.substr(lastIdx, str.length - lastIdx);

    //var matched = patternIdx == patternLength;
    if(patternIdx == patternLength){
        return {score: score, formattedStr: formattedStr}
    } else {
        return null;
    }
}