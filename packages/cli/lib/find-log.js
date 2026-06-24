import { styleText } from 'node:util';
import { createFilesProvider, RETURN, PROMPT } from 'files-provider';

export async function findLog(head) {
  const provideFiles = createFilesProvider({
    single: RETURN,
    multi: PROMPT,
    choiceAll: false,
    promptHeader: head + ': please select a v8.log file to open: ',
    regex: /^(isolate-.+-)?v8.log$/,
  });

  const root = process.cwd();
  const v8logFiles = await provideFiles.fromDirectory(root);

  if (v8logFiles.length === 0) {
    console.error(head + ': Problem:\n');
    console.error(
      head +
        ': Unable to find a v8.log or isolate-*-v8.log in the current directory.',
    );
    console.error(
      head + ': Please produce it via "<node|d8> --trace-ic app.js"',
    );
    return;
  }

  const p = v8logFiles[0].fullPath;
  console.log(`${head} ${styleText('gray', 'Processing logfile at ' + p)}`);
  return p;
}
