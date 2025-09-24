#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Conservative false positive detection script for unbound method errors.
 * We start with specific, clear patterns and will add more over time.
 */

function loadDebugFile(debugPath) {
    const issues = [];
    const content = fs.readFileSync(debugPath, 'utf-8');
    const lines = content.split('\n');

    let currentFile = '';
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        // Check if this is a file path
        if (line.match(/^\/workspaces\/vscode\/.*\.(ts|js|tsx|jsx)$/)) {
            currentFile = line.replace('/workspaces/vscode/', '/home/simon/.cache/repos/vscode/');
            i++;
            continue;
        }

        // Check if this is an error line
        if (line.includes('error') && line.includes(':')) {
            const match = line.match(/^\s*(\d+):/);
            if (match && currentFile) {
                const lineNum = parseInt(match[1]);
                const fileContent = getFileContent(currentFile);
                const lineContent = getLineContent(fileContent, lineNum);

                issues.push({
                    file: currentFile,
                    line: lineNum,
                    content: lineContent
                });
            }
        }

        i++;
    }

    return issues;
}

function getFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.warn(`Could not read file ${filePath}: ${error}`);
        return '';
    }
}

function getLineContent(fileContent, lineNum) {
    const lines = fileContent.split('\n');
    if (lineNum > 0 && lineNum <= lines.length) {
        return lines[lineNum - 1].trim();
    }
    return '';
}

function isFalsePositive(issue) {
    const { content } = issue;

    // Condition 1: Event.any, Event.map, Event.signal patterns
    // These are false positives because Event methods handle this binding correctly
    if (content.includes('Event.any') || content.includes('Event.map') || content.includes('Event.signal')) {
        return {
            isFalsePositive: true,
            reason: 'Event.any/map/signal - Event methods handle this binding correctly'
        };
    }

    // TODO: Add more conditions over time as we identify clear false positive patterns
    // Examples of future conditions to consider:
    // - Static method calls (but need to be more careful about detection)
    // - Arrow functions (but need to verify they don't have this issues)
    // - Built-in utility methods (but need to verify the specific methods)

    return {
        isFalsePositive: false
    };
}

function main() {
    console.log('Analyzing unbound method errors for false positives...\n');

    const issues = loadDebugFile('debug.txt');
    console.log(`Loaded ${issues.length} issues to analyze\n`);

    let falsePositiveCount = 0;
    let realIssueCount = 0;
    const falsePositives = [];

    for (const issue of issues) {
        const result = isFalsePositive(issue);

        if (result.isFalsePositive) {
            falsePositiveCount++;
            falsePositives.push({
                issue,
                reason: result.reason
            });
            console.log(`FALSE POSITIVE: ${issue.file}:${issue.line}`);
            console.log(`  Reason: ${result.reason}`);
            console.log(`  Content: ${issue.content}`);
            console.log('');
        } else {
            realIssueCount++;
        }
    }

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total issues: ${issues.length}`);
    console.log(`False positives: ${falsePositiveCount}`);
    console.log(`Real issues: ${realIssueCount}`);
    console.log(`False positive rate: ${((falsePositiveCount / issues.length) * 100).toFixed(1)}%`);

    // Write detailed report
    const reportPath = 'false_positives_detailed_report.txt';
    let reportContent = 'FALSE POSITIVES DETAILED REPORT\n';
    reportContent += '='.repeat(50) + '\n\n';
    reportContent += `Total issues analyzed: ${issues.length}\n`;
    reportContent += `False positives: ${falsePositiveCount}\n`;
    reportContent += `Real issues: ${realIssueCount}\n`;
    reportContent += `False positive rate: ${((falsePositiveCount / issues.length) * 100).toFixed(1)}%\n\n`;

    for (const fp of falsePositives) {
        reportContent += `${fp.issue.file}:${fp.issue.line}\n`;
        reportContent += `  Reason: ${fp.reason}\n`;
        reportContent += `  Content: ${fp.issue.content}\n\n`;
    }

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nDetailed report written to ${reportPath}`);
}

if (require.main === module) {
    main();
}
