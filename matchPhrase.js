const matchPhrase = (data, db) => {
    //Remove non-alphanumeric characters, split at space
    const cvSplitText = data.replace(/[.,•!$%|\/\^\*;:{}=_`~()\n]/g, " ").split( " " ) 
    
    //Convert to lower case
    const cvLower = cvSplitText.map( (word) => word.toLowerCase() ) 
    
    //Filter empty words and numbers
    const cvValidWords = cvLower.filter( (word) => word && word.match(/^[0-9]+$/) == null ) 
    
    const matches = new Set();

    for (let i = 0; i < cvValidWords.length; i++){
        wordLength = 0
        current_phrase = []
        let filtered = db.filter( (phrase) => phrase[wordLength] == cvValidWords[i + wordLength] )

        while(filtered.length > 0){
            wordLength += 1
            current_phrase.push(cvValidWords[i + wordLength - 1] )
            // console.log(current_phrase)

            if (filtered.some( (phrase) => phrase.length == current_phrase.length) ){
                matches.add(current_phrase.join(" "))
            }

            if (i + wordLength >= cvValidWords.length){
                break
            }

            filtered = filtered.filter( (phrase) => phrase.length > wordLength &&
            phrase[wordLength] == cvValidWords[i + wordLength] )
        }
    }
    
    return matches
}

module.exports = matchPhrase