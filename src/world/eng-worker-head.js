/* ENG WORKER HEAD (3.2.0 Web Worker, stage d): the first lines of the worker script (tools/build/build.js #engsrc). The engine code
   names the page as `window`; in the worker that is the worker itself. It reads no storage of its own: the page sends its saved
   fixes and settings with the start (src/world/eng-page.js), so the storage here is empty */
self.window = self;
self.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
