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

    // Condition 2: Static class method calls (Class.staticMethod patterns)
    // These are false positives because static methods don't have 'this' context issues
    const staticMethodPattern = /[A-Z][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*\(/;
    if (staticMethodPattern.test(content)) {
        return {
            isFalsePositive: true,
            reason: 'Static class method call - static methods don\'t have this binding issues'
        };
    }

    // Condition 3: Static method definitions
    // These are false positives because they're method definitions, not calls
    if (content.includes('static ') && content.includes('(')) {
        return {
            isFalsePositive: true,
            reason: 'Static method definition - not a method call'
        };
    }

    // TODO: Add more conditions over time as we identify clear false positive patterns
    // Examples of future conditions to consider:
    // - Arrow functions (but need to verify they don't have this issues)
    // - Built-in utility methods (but need to verify the specific methods)
    // - Constructor calls (new ClassName())

    return {
        isFalsePositive: false
    };
}

function createCleanDebugFile(issues, falsePositives) {
    const content = fs.readFileSync('debug.txt', 'utf-8');
    const lines = content.split('\n');

    // Create a set of false positive file:line combinations for quick lookup
    const falsePositiveSet = new Set();
    for (const fp of falsePositives) {
        const workspacePath = fp.issue.file.replace('/home/simon/.cache/repos/vscode/', '/workspaces/vscode/');
        falsePositiveSet.add(`${workspacePath}:${fp.issue.line}`);
    }

    const cleanLines = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        // Check if this is a file path
        if (line.match(/^\/workspaces\/vscode\/.*\.(ts|js|tsx|jsx)$/)) {
            const filePath = line;
            const fileLines = [];
            let hasRealIssues = false;

            // Store the file path line
            const filePathLine = lines[i];

            // Collect all error lines for this file
            i++;
            while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^\/workspaces\/vscode\/.*\.(ts|js|tsx|jsx)$/)) {
                const errorLine = lines[i].trim();
                if (errorLine.includes('error') && errorLine.includes(':')) {
                    const match = errorLine.match(/^\s*(\d+):/);
                    if (match) {
                        const lineNum = parseInt(match[1]);
                        const key = `${filePath}:${lineNum}`;

                        // Only include if it's NOT a false positive
                        if (!falsePositiveSet.has(key)) {
                            fileLines.push(lines[i]);
                            hasRealIssues = true;
                        }
                        // Skip false positives
                    } else {
                        fileLines.push(lines[i]);
                    }
                } else {
                    fileLines.push(lines[i]);
                }
                i++;
            }

            // Only include this file if it has real issues
            if (hasRealIssues) {
                cleanLines.push(filePathLine); // Add the file path line
                cleanLines.push(...fileLines);
                cleanLines.push(''); // Add spacing
            }
        } else {
            // Not a file path, keep the line
            cleanLines.push(lines[i]);
            i++;
        }
    }

    // Write clean debug file
    fs.writeFileSync('debug_clean.txt', cleanLines.join('\n'));
    return cleanLines.length;
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

    // Create clean debug file
    console.log('\nCreating clean debug file...');
    const cleanLineCount = createCleanDebugFile(issues, falsePositives);
    console.log(`Clean debug file created: debug_clean.txt (${cleanLineCount} lines)`);

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
