const fs = require('fs')
const pdf = require('pdf-parse')
const {parse} = require('csv-parse/sync')
const { convert } = require('html-to-text')
const matchPhrase = require('./matchPhrase')

const scanResume = async (resume, jobDesc) => {

    const keywordFile = fs.readFileSync('keywords.csv')
    const keywords = await parse(keywordFile, {})
    const db = keywords.map( (entry) => entry[0].toLowerCase().split(" ") )
    const jobDescMatches = matchPhrase(jobDesc, db)
    jobDescArray = [...jobDescMatches]
    const jobDescSplit = jobDescArray.map( (match) => match.split(" ") )

    const resumeData = convert(resume)

    const bothMatches = matchPhrase(resumeData, jobDescSplit)
    const bothMatchesArr = Array.from(bothMatches)
    const notMatchedArr = jobDescArray.filter( (match) => !bothMatchesArr.includes(match) )
    return {match: bothMatchesArr, notMatch: notMatchedArr}
    // return (resumeData)

}


module.exports = scanResume





