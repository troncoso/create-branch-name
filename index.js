#!/usr/bin/env node

const program = require('commander');
const clipboardy = require('clipboardy');
const simpleGit = require('simple-git');
const DEBUG = false;

program
    .usage('"<github-title-with-issue-number>" [options]')
    .option('-c, --copy-only', 'copy the branch name to the clipboard instead of creating the branch')
    .option('-t, --title-only', 'copy the commit title to the clipboard instead of creating the branch')
    .parse(process.argv);

const args = program.args;
if (!args || args.length < 1) {
    throw new Error('Must provide the github title and issue number as a string');
}
const options = program.opts();

function log(val, msg = null) {
    if (DEBUG) {
        console.debug(`(DEBUG)${msg ? ' ' + msg : ''} ${val}`);
    }
    return val;
}

(async () => {
    try {
        const title = program.args[0];
        // Extract issue number from description
        const issueNumber = log(new RegExp(/.*(#\d+)/g).exec(title)[1].replace('#', '').trim(), 'extracting issue number:');
        // Remove the issue number from the description
        const description = log(title.replace(`#${issueNumber}`, '').trim(), 'remove issue num:');
        // Remove special characters
        let cleanDescription = log(description.replace(/[^0-9a-zA-Z _]/g, ' '), 'remove special chars:');
        // Convert multiple spaces into 1
        cleanDescription = log(cleanDescription.replace(/[ ]+/g, ' '), 'remove extra spaces:');
        // Set to lowercase and trim outstanding whitespace
        cleanDescription = log(cleanDescription.toLowerCase().trim(), 'lower case and trim:');

        const completeDescription = `issue-${issueNumber}-${cleanDescription.split(' ').join('-')}`;
        const commitMessage = `Fixes #${issueNumber} ${description}`;

        if (options.copyOnly) {
            // Just copy the branch name to the clipboard
            clipboardy.writeSync(completeDescription);
            console.log(`${completeDescription} copied to clipboard`);
            return;
        }
        if (options.titleOnly) {
            clipboardy.writeSync(commitMessage);
            console.log(`Commit message copied to clipboard: ${commitMessage}`);
            return;
        }
        
        const git = simpleGit();

        // Create the new branch and check it out
        await git.checkoutLocalBranch(completeDescription);
        console.log(`Branch ${completeDescription} successfully created and checked out`);

        clipboardy.writeSync(commitMessage);
        console.log(`Commit message copied to clipboard: ${commitMessage}`);
        
    }
    catch (error) {
        console.error('Failed to parse github title');
        console.error(error);
    }
})();