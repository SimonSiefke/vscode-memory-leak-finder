from pathlib import Path
import sys,json,hashlib
root=Path(sys.argv[1]);extension=root/'test/smoke/extensions/vscode-smoketest-ext-host/extension.js';tests=root/'test/smoke/out/areas/chat/chatSessions.test.js';changes=[]
def change(file,old,new):
 before=file.read_text();assert before.count(old)==1,(str(file),before.count(old));after=before.replace(old,new,1);temp=file.with_suffix(file.suffix+'.readiness-tmp');temp.write_text(after);temp.replace(file);changes.append({'file':str(file.relative_to(root)),'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()})
old="const command = 'workbench.action.chat.newLocalChat';\n\t\t\tawait waitForCommand(command, 60_000);\n\t\t\tawait vscode.commands.executeCommand(command);"
new=old+"\n\t\t\tfs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });\n\t\t\tfs.writeFileSync(path.join(context.globalStorageUri.fsPath, 'local-chat-command-ready'), 'ready');"
change(extension,old,new)
old="    else {\n        // The chat view may already be open, so wait for the command to bind a"
new="    else {\n        const readyFile = session.command === 'smoketest.openLocalChat' ? path.join(app.userDataPath, 'User', 'globalStorage', 'vscode.vscode-smoketest-ext-host', 'local-chat-command-ready') : undefined;\n        if (readyFile) { fs.rmSync(readyFile, { force: true }); }\n        // The chat view may already be open, so wait for the command to bind a"
change(tests,old,new)
old='        await app.workbench.chat.waitForChatViewSessionChange(previousSessionResource, 600);'
new=old+"\n        if (readyFile) {\n            const deadline = Date.now() + 60000;\n            while (!fs.existsSync(readyFile)) {\n                if (Date.now() >= deadline) { throw new Error('Local chat command did not complete'); }\n                await new Promise(resolve => setTimeout(resolve, 10));\n            }\n        }"
change(tests,old,new)
meta={'name':'local-chat-command-completion','assertionsChanged':False,'enabledTestsChanged':False,'fixtureResponsesChanged':False,'reason':'Palette dismissal and first resource binding can precede the explicit new-local-chat command; wait for its completion before sending a prompt','changes':changes};(root/'local-chat-readiness-patch.json').write_text(json.dumps(meta,indent=2)+'\n');print('Added identical command-completion readiness wait; assertions and test inventory retained')
