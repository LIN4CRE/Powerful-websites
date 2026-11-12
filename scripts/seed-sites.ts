/**
 * Editorial seed list.
 *
 * These are *candidates*, not published listings. Every entry is fed through the
 * VERIFIER (real browser, clean context) before it can appear in the directory.
 * `scripts/seed.ts` writes them to data/candidates.json with status "pending".
 *
 * Descriptions are written from first-hand knowledge of each site, kept to a
 * single factual sentence. Nothing here claims a price, a licence or a login
 * policy that the verifier does not subsequently confirm.
 */

export interface SeedEntry {
  name: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
  openSource?: boolean;
  license?: string | null;
  repo?: string | null;
  source?: string;
}

export const SEED_CANDIDATES: SeedEntry[] = [
  // ── AI & Artificial Intelligence ──────────────────────────────────────────
  {
    name: 'DuckDuckGo AI Chat',
    url: 'https://duck.ai',
    category: 'ai',
    description:
      'Chat with several leading AI models anonymously, with no account and no chat history stored.',
    tags: ['chatbot', 'privacy', 'anonymous'],
    source: 'editorial-research',
  },
  {
    name: 'Pollinations',
    url: 'https://pollinations.ai',
    category: 'ai',
    description:
      'Generate images and text with open AI models through keyless APIs and simple browser apps.',
    tags: ['image-generation', 'api', 'open-models'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/pollinations/pollinations',
    source: 'github-topics',
  },
  {
    name: 'Remove.bg',
    url: 'https://www.remove.bg',
    category: 'ai',
    description:
      'Cuts the background out of any photo automatically and lets you download a transparent PNG.',
    tags: ['background-removal', 'photos', 'png'],
    source: 'editorial-research',
  },
  {
    name: 'Cleanup.pictures',
    url: 'https://cleanup.pictures',
    category: 'ai',
    description:
      'Paints over unwanted objects, people or text in a photo and reconstructs what was behind them.',
    tags: ['photo-editing', 'inpainting', 'retouch'],
    source: 'editorial-research',
  },
  {
    name: 'Hugging Face Spaces',
    url: 'https://huggingface.co/spaces',
    category: 'ai',
    description:
      'Thousands of community-built AI demos for image, audio, text and video that run in your browser.',
    tags: ['demos', 'machine-learning', 'playground'],
    source: 'editorial-research',
  },
  {
    name: 'This Person Does Not Exist',
    url: 'https://thispersondoesnotexist.com',
    category: 'ai',
    description: 'Generates a new synthetic human face every time you refresh the page.',
    tags: ['faces', 'gan', 'generated'],
    source: 'editorial-research',
  },

  // ── Productivity ──────────────────────────────────────────────────────────
  {
    name: 'Excalidraw',
    url: 'https://excalidraw.com',
    category: 'productivity',
    description:
      'A hand-drawn-style whiteboard for sketching diagrams that saves locally and shares by link.',
    tags: ['whiteboard', 'diagrams', 'collaboration'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/excalidraw/excalidraw',
    source: 'github-topics',
  },
  {
    name: 'tldraw',
    url: 'https://www.tldraw.com',
    category: 'productivity',
    description:
      'A fast collaborative canvas for quick diagrams, wireframes and sketches with shareable links.',
    tags: ['canvas', 'whiteboard', 'sketching'],
    source: 'editorial-research',
  },
  {
    name: 'Pomofocus',
    url: 'https://pomofocus.io',
    category: 'productivity',
    description:
      'A Pomodoro timer with task tracking that keeps running in the tab without an account.',
    tags: ['pomodoro', 'timer', 'focus'],
    source: 'editorial-research',
  },
  {
    name: 'Witeboard',
    url: 'https://witeboard.com',
    category: 'productivity',
    description:
      'An instant shared whiteboard: draw immediately, then send the link to anyone.',
    tags: ['whiteboard', 'sharing', 'real-time'],
    source: 'editorial-research',
  },
  {
    name: 'Goblin Tools',
    url: 'https://goblin.tools',
    category: 'productivity',
    description:
      'Free AI helpers that break overwhelming tasks into small steps and adjust the tone of a message.',
    tags: ['tasks', 'ai', 'neurodivergent'],
    source: 'editorial-research',
  },
  {
    name: 'Teleprompter Mirror',
    url: 'https://telepromptermirror.com/teleprompter.htm',
    category: 'productivity',
    description:
      'A browser teleprompter with adjustable speed, text size, colours and mirror mode for recording.',
    tags: ['teleprompter', 'video', 'recording'],
    source: 'editorial-research',
  },
  {
    name: 'Online Stopwatch',
    url: 'https://www.online-stopwatch.com',
    category: 'productivity',
    description:
      'Stopwatches, countdown timers and classroom timers that start with a single click.',
    tags: ['timer', 'stopwatch', 'countdown'],
    source: 'editorial-research',
  },
  {
    name: 'HackMD',
    url: 'https://hackmd.io',
    category: 'productivity',
    description:
      'A collaborative Markdown editor where you can start writing in an anonymous note right away.',
    tags: ['markdown', 'notes', 'collaboration'],
    source: 'editorial-research',
  },

  // ── Developer Tools ───────────────────────────────────────────────────────
  {
    name: 'regex101',
    url: 'https://regex101.com',
    category: 'developer',
    description:
      'Builds and debugs regular expressions live with match explanations and a built-in test suite.',
    tags: ['regex', 'testing', 'debugging'],
    source: 'editorial-research',
  },
  {
    name: 'RegExr',
    url: 'https://regexr.com',
    category: 'developer',
    description:
      'An interactive regex playground with cheatsheets and community patterns for JavaScript and PCRE.',
    tags: ['regex', 'cheatsheet', 'editor'],
    source: 'editorial-research',
  },
  {
    name: 'CyberChef',
    url: 'https://gchq.github.io/CyberChef/',
    category: 'developer',
    description:
      'A visual toolkit for encoding, decoding, hashing, encrypting and transforming data locally in the browser.',
    tags: ['encoding', 'crypto', 'data'],
    openSource: true,
    license: 'Apache-2.0',
    repo: 'https://github.com/gchq/CyberChef',
    source: 'github-topics',
  },
  {
    name: 'JSON Crack',
    url: 'https://jsoncrack.com',
    category: 'developer',
    description:
      'Turns JSON, YAML and CSV into an explorable node graph you can search and export.',
    tags: ['json', 'visualisation', 'diagram'],
    source: 'editorial-research',
  },
  {
    name: 'Transform Tools',
    url: 'https://transform.tools',
    category: 'developer',
    description:
      'Converts code and data between formats such as JSON to TypeScript, HTML to JSX and YAML to JSON.',
    tags: ['converter', 'json', 'typescript'],
    source: 'editorial-research',
  },
  {
    name: 'Carbon',
    url: 'https://carbon.now.sh',
    category: 'developer',
    description:
      'Creates polished screenshots of source code with themes, padding and window controls.',
    tags: ['screenshots', 'code', 'sharing'],
    source: 'editorial-research',
  },
  {
    name: 'Ray.so',
    url: 'https://ray.so',
    category: 'developer',
    description:
      'Generates clean, shareable images of code snippets with light and dark themes.',
    tags: ['screenshots', 'code', 'images'],
    source: 'editorial-research',
  },
  {
    name: 'DevDocs',
    url: 'https://devdocs.io',
    category: 'developer',
    description:
      'A single fast interface for hundreds of API documentations that also works offline.',
    tags: ['documentation', 'offline', 'reference'],
    openSource: true,
    license: 'MPL-2.0',
    repo: 'https://github.com/freeCodeCamp/devdocs',
    source: 'github-topics',
  },
  {
    name: 'Crontab Guru',
    url: 'https://crontab.guru',
    category: 'developer',
    description: 'Explains cron expressions in plain English and shows the next run times.',
    tags: ['cron', 'schedule', 'reference'],
    source: 'editorial-research',
  },
  {
    name: 'ExplainShell',
    url: 'https://explainshell.com',
    category: 'developer',
    description:
      'Breaks a shell command into its parts and shows the help text for each option.',
    tags: ['shell', 'linux', 'learning'],
    source: 'editorial-research',
  },
  {
    name: 'IT Tools',
    url: 'https://it-tools.tech',
    category: 'developer',
    description:
      'A large collection of developer utilities, from hashing and JWTs to UUIDs and cron parsing.',
    tags: ['utilities', 'hash', 'jwt'],
    openSource: true,
    license: 'GPL-3.0',
    repo: 'https://github.com/CorentinTh/it-tools',
    source: 'github-topics',
  },
  {
    name: 'Omatsuri',
    url: 'https://omatsuri.app',
    category: 'developer',
    description:
      'A set of browser-only tools for CSS, colours, SVG and text with no upload or sign-up.',
    tags: ['css', 'utilities', 'browser-only'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/rtivital/omatsuri',
    source: 'github-topics',
  },
  {
    name: 'Hoppscotch',
    url: 'https://hoppscotch.io',
    category: 'developer',
    description:
      'A lightweight API client for sending REST, GraphQL and WebSocket requests from the browser.',
    tags: ['api', 'http', 'graphql'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/hoppscotch/hoppscotch',
    source: 'github-topics',
  },
  {
    name: 'webhook.site',
    url: 'https://webhook.site',
    category: 'developer',
    description:
      'Gives you a unique URL that records incoming HTTP requests and webhooks for inspection.',
    tags: ['webhooks', 'http', 'testing'],
    source: 'editorial-research',
  },
  {
    name: 'Can I Use',
    url: 'https://caniuse.com',
    category: 'developer',
    description:
      'Shows browser support tables for modern web platform features across desktop and mobile.',
    tags: ['browser-support', 'css', 'reference'],
    source: 'editorial-research',
  },
  {
    name: 'Bundlephobia',
    url: 'https://bundlephobia.com',
    category: 'developer',
    description:
      'Checks the install size and download cost of any npm package before you add it.',
    tags: ['npm', 'performance', 'javascript'],
    source: 'editorial-research',
  },
  {
    name: 'quicktype',
    url: 'https://app.quicktype.io',
    category: 'developer',
    description:
      'Generates typed models and serialisers from JSON, TypeScript or GraphQL in many languages.',
    tags: ['codegen', 'types', 'json'],
    source: 'editorial-research',
  },
  {
    name: 'Mockaroo',
    url: 'https://www.mockaroo.com',
    category: 'developer',
    description:
      'Generates realistic mock data and test datasets in CSV, JSON, SQL and Excel formats.',
    tags: ['mock-data', 'csv', 'testing'],
    source: 'editorial-research',
  },
  {
    name: 'Diffchecker',
    url: 'https://www.diffchecker.com',
    category: 'developer',
    description:
      'Compares two texts, documents or images and highlights the differences line by line.',
    tags: ['diff', 'compare', 'text'],
    source: 'editorial-research',
  },

  // ── Programming & Coding ──────────────────────────────────────────────────
  {
    name: 'Compiler Explorer',
    url: 'https://godbolt.org',
    category: 'programming',
    description:
      'Compiles source code and shows the generated assembly side by side for dozens of languages.',
    tags: ['compilers', 'assembly', 'c++'],
    source: 'editorial-research',
  },
  {
    name: 'StackBlitz',
    url: 'https://stackblitz.com',
    category: 'programming',
    description:
      'Runs full-stack JavaScript and TypeScript projects in the browser without installing anything.',
    tags: ['sandbox', 'frontend', 'node'],
    source: 'editorial-research',
  },
  {
    name: 'JSFiddle',
    url: 'https://jsfiddle.net',
    category: 'programming',
    description:
      'A quick playground for HTML, CSS and JavaScript with instant preview and shareable links.',
    tags: ['playground', 'html', 'javascript'],
    source: 'editorial-research',
  },
  {
    name: 'CodePen',
    url: 'https://codepen.io',
    category: 'programming',
    description:
      'A front-end playground to write, preview and share HTML, CSS and JavaScript snippets.',
    tags: ['playground', 'css', 'frontend'],
    source: 'editorial-research',
  },
  {
    name: 'SQLite Online',
    url: 'https://sqliteonline.com',
    category: 'programming',
    description:
      'Runs SQL queries against SQLite, MySQL and PostgreSQL sandboxes directly in the browser.',
    tags: ['sql', 'database', 'playground'],
    source: 'editorial-research',
  },
  {
    name: 'DB Fiddle',
    url: 'https://www.db-fiddle.com',
    category: 'programming',
    description:
      'Creates and shares SQL fiddles with schema, queries and results for several database engines.',
    tags: ['sql', 'schema', 'sharing'],
    source: 'editorial-research',
  },
  {
    name: 'Python Tutor',
    url: 'https://pythontutor.com',
    category: 'programming',
    description:
      'Visualises Python, JavaScript, C and Java execution step by step with memory diagrams.',
    tags: ['python', 'learning', 'visualisation'],
    openSource: true,
    license: 'BSD-3-Clause',
    repo: 'https://github.com/pgbovine/OnlinePythonTutor',
    source: 'github-topics',
  },
  {
    name: 'OnlineGDB',
    url: 'https://www.onlinegdb.com',
    category: 'programming',
    description:
      'Compiles and debugs C, C++, Python, Java and more in the browser with breakpoints.',
    tags: ['compiler', 'debugger', 'ide'],
    source: 'editorial-research',
  },

  // ── Design & Graphics ────────────────────────────────────────────────────
  {
    name: 'Coolors',
    url: 'https://coolors.co',
    category: 'design',
    description:
      'Generates colour palettes with a spacebar, then lets you adjust, check contrast and export.',
    tags: ['colours', 'palettes', 'accessibility'],
    source: 'editorial-research',
  },
  {
    name: 'CSS Gradient',
    url: 'https://cssgradient.io',
    category: 'design',
    description:
      'Builds linear, radial and conic CSS gradients visually and copies the generated code.',
    tags: ['css', 'gradients', 'code'],
    source: 'editorial-research',
  },
  {
    name: 'Haikei',
    url: 'https://haikei.app',
    category: 'design',
    description:
      'Generates SVG backgrounds such as waves, blobs and mesh gradients ready to download.',
    tags: ['svg', 'backgrounds', 'generator'],
    source: 'editorial-research',
  },
  {
    name: 'Google Fonts',
    url: 'https://fonts.google.com',
    category: 'design',
    description:
      'Browse, preview and pair open-source typefaces, then copy the embed code or font files.',
    tags: ['fonts', 'typography', 'open-source'],
    source: 'editorial-research',
  },
  {
    name: 'unDraw',
    url: 'https://undraw.co',
    category: 'design',
    description:
      'A library of open illustrations whose accent colour you can change before downloading the SVG.',
    tags: ['illustrations', 'svg', 'free-assets'],
    source: 'editorial-research',
  },
  {
    name: 'Lucide',
    url: 'https://lucide.dev',
    category: 'design',
    description:
      'A consistent open-source icon set you can customise and copy as SVG or framework components.',
    tags: ['icons', 'svg', 'open-source'],
    openSource: true,
    license: 'ISC',
    repo: 'https://github.com/lucide-icons/lucide',
    source: 'github-topics',
  },
  {
    name: 'Iconify',
    url: 'https://icon-sets.iconify.design',
    category: 'design',
    description:
      'Searches more than 200,000 open-source icons across icon sets and exports them as SVG.',
    tags: ['icons', 'search', 'svg'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/iconify/iconify',
    source: 'github-topics',
  },
  {
    name: 'SVGRepo',
    url: 'https://www.svgrepo.com',
    category: 'design',
    description:
      'Searches and downloads hundreds of thousands of vector icons and illustrations.',
    tags: ['icons', 'vectors', 'download'],
    source: 'editorial-research',
  },
  {
    name: 'Blobmaker',
    url: 'https://www.blobmaker.app',
    category: 'design',
    description: 'Generates organic blob shapes as editable SVG you can copy or download.',
    tags: ['svg', 'shapes', 'generator'],
    source: 'editorial-research',
  },
  {
    name: 'Smooth Shadow',
    url: 'https://shadows.brumm.af',
    category: 'design',
    description:
      'Builds layered, natural-looking CSS box shadows with a live preview and generated code.',
    tags: ['css', 'shadows', 'generator'],
    source: 'editorial-research',
  },
  {
    name: 'Color Hunt',
    url: 'https://colorhunt.co',
    category: 'design',
    description:
      'A curated feed of four-colour palettes you can browse, save or copy hex codes from.',
    tags: ['colours', 'palettes', 'inspiration'],
    source: 'editorial-research',
  },

  // ── Image & Photography ───────────────────────────────────────────────────
  {
    name: 'Squoosh',
    url: 'https://squoosh.app',
    category: 'image',
    description:
      'Compresses and converts images in a local browser tab using advanced codecs with a live quality preview.',
    tags: ['compression', 'webp', 'avif'],
    openSource: true,
    license: 'Apache-2.0',
    repo: 'https://github.com/GoogleChromeLabs/squoosh',
    source: 'github-topics',
  },
  {
    name: 'TinyPNG',
    url: 'https://tinypng.com',
    category: 'image',
    description:
      'Shrinks PNG, JPEG and WebP files with smart lossy compression and a visual before/after slider.',
    tags: ['compression', 'png', 'optimisation'],
    source: 'editorial-research',
  },
  {
    name: 'Photopea',
    url: 'https://www.photopea.com',
    category: 'image',
    description:
      'A full Photoshop-style image editor in the browser that opens PSD, XCF, Sketch and RAW files.',
    tags: ['editor', 'psd', 'layers'],
    source: 'editorial-research',
  },
  {
    name: 'iLoveIMG',
    url: 'https://www.iloveimg.com',
    category: 'image',
    description:
      'Resizes, crops, compresses and converts batches of images without an account.',
    tags: ['resize', 'crop', 'convert'],
    source: 'editorial-research',
  },
  {
    name: 'Image Resizer',
    url: 'https://imageresizer.com',
    category: 'image',
    description:
      'Resizes and crops images to exact pixel dimensions straight from the browser.',
    tags: ['resize', 'crop', 'dimensions'],
    source: 'editorial-research',
  },
  {
    name: 'Unsplash',
    url: 'https://unsplash.com',
    category: 'image',
    description:
      'A large library of high-resolution photographs that can be browsed and downloaded freely.',
    tags: ['stock-photos', 'photography', 'free-assets'],
    source: 'editorial-research',
  },
  {
    name: 'Pexels',
    url: 'https://www.pexels.com',
    category: 'image',
    description:
      'Free stock photos and videos from a large contributor community, searchable by colour and orientation.',
    tags: ['stock-photos', 'video', 'free-assets'],
    source: 'editorial-research',
  },
  {
    name: 'Pixabay',
    url: 'https://pixabay.com',
    category: 'image',
    description:
      'Over five million free photos, illustrations, vectors and videos shared under a generous licence.',
    tags: ['stock-photos', 'illustrations', 'vectors'],
    source: 'editorial-research',
  },
  {
    name: 'Openverse',
    url: 'https://openverse.org',
    category: 'image',
    description:
      'Searches openly licensed and public-domain images and audio across hundreds of collections.',
    tags: ['creative-commons', 'search', 'audio'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/WordPress/openverse',
    source: 'github-topics',
  },
  {
    name: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org',
    category: 'image',
    description:
      'A vast media repository of freely licensed photographs, diagrams, audio and video.',
    tags: ['creative-commons', 'media', 'archive'],
    source: 'editorial-research',
  },
  {
    name: 'ImgOps',
    url: 'https://imgops.com',
    category: 'image',
    description:
      'Sends any image URL to dozens of analysis and editing services from one page.',
    tags: ['metadata', 'analysis', 'utilities'],
    source: 'editorial-research',
  },

  // ── Video & Audio ────────────────────────────────────────────────────────
  {
    name: '123apps',
    url: 'https://123apps.com',
    category: 'video-audio',
    description:
      'A suite of audio, video and PDF converters and editors that run in the browser.',
    tags: ['converters', 'video', 'audio'],
    source: 'editorial-research',
  },
  {
    name: 'Wavacity',
    url: 'https://wavacity.com',
    category: 'video-audio',
    description:
      'A browser port of the Audacity audio editor with multi-track recording and effects.',
    tags: ['audio-editor', 'recording', 'effects'],
    openSource: true,
    license: 'GPL-2.0',
    repo: 'https://github.com/tjoen/wavacity',
    source: 'github-topics',
  },
  {
    name: 'Vocaroo',
    url: 'https://vocaroo.com',
    category: 'video-audio',
    description:
      'Records a voice message in the browser and produces a link or download with no account.',
    tags: ['voice-recording', 'sharing', 'audio'],
    source: 'editorial-research',
  },
  {
    name: 'MP3Cut',
    url: 'https://mp3cut.net',
    category: 'video-audio',
    description:
      'Trims MP3 and other audio files visually, with fade effects and format conversion.',
    tags: ['trim', 'mp3', 'audio'],
    source: 'editorial-research',
  },
  {
    name: 'Vocal Remover',
    url: 'https://vocalremover.org',
    category: 'video-audio',
    description:
      'Splits a song into vocals and instrumental, and includes key, tempo and pitch tools.',
    tags: ['karaoke', 'stems', 'audio'],
    source: 'editorial-research',
  },
  {
    name: 'TTSMaker',
    url: 'https://ttsmaker.com',
    category: 'video-audio',
    description:
      'Converts text to speech in many languages with a choice of voices and downloadable MP3 output.',
    tags: ['text-to-speech', 'mp3', 'voices'],
    source: 'editorial-research',
  },
  {
    name: 'Online Audio Converter',
    url: 'https://online-audio-converter.com',
    category: 'video-audio',
    description:
      'Converts audio between MP3, WAV, FLAC, OGG and M4A with quality and bitrate controls.',
    tags: ['audio-converter', 'formats', 'quality'],
    source: 'editorial-research',
  },
  {
    name: 'FreeConvert',
    url: 'https://www.freeconvert.com',
    category: 'video-audio',
    description:
      'Converts video, audio, images and documents between formats with compression options.',
    tags: ['converters', 'video', 'compression'],
    source: 'editorial-research',
  },
  {
    name: 'Audio Joiner',
    url: 'https://audio-joiner.com',
    category: 'video-audio',
    description:
      'Joins multiple audio files into one track with crossfade and trim controls.',
    tags: ['audio', 'merge', 'editing'],
    source: 'editorial-research',
  },

  // ── Writing & Documents ──────────────────────────────────────────────────
  {
    name: 'LanguageTool',
    url: 'https://languagetool.org',
    category: 'writing',
    description:
      'Checks spelling, grammar and style in over 30 languages directly in the browser.',
    tags: ['grammar', 'spelling', 'editor'],
    source: 'editorial-research',
  },
  {
    name: 'Hemingway Editor',
    url: 'https://hemingwayapp.com',
    category: 'writing',
    description:
      'Highlights long sentences, passive voice and hard-to-read passages as you write.',
    tags: ['readability', 'editing', 'style'],
    source: 'editorial-research',
  },
  {
    name: 'DeepL',
    url: 'https://www.deepl.com/translator',
    category: 'writing',
    description:
      'Translates text and documents between languages with tone and formality controls.',
    tags: ['translation', 'languages', 'documents'],
    source: 'editorial-research',
  },
  {
    name: 'Google Translate',
    url: 'https://translate.google.com',
    category: 'writing',
    description:
      'Translates text, speech, images and whole web pages across more than 100 languages.',
    tags: ['translation', 'languages', 'speech'],
    source: 'editorial-research',
  },
  {
    name: 'Linguee',
    url: 'https://www.linguee.com',
    category: 'writing',
    description:
      'Shows how words and phrases are actually used in bilingual example sentences from the web.',
    tags: ['dictionary', 'translation', 'examples'],
    source: 'editorial-research',
  },
  {
    name: 'Reverso Context',
    url: 'https://context.reverso.net',
    category: 'writing',
    description:
      'Finds translations of words in context with real example sentences and conjugation tables.',
    tags: ['translation', 'conjugation', 'examples'],
    source: 'editorial-research',
  },
  {
    name: 'WordCounter',
    url: 'https://wordcounter.net',
    category: 'writing',
    description:
      'Counts words, characters and reading time while flagging overused words and phrases.',
    tags: ['word-count', 'readability', 'editing'],
    source: 'editorial-research',
  },
  {
    name: 'Slick Write',
    url: 'https://www.slickwrite.com',
    category: 'writing',
    description:
      'Analyses prose for readability, word repetition and sentence structure as you type.',
    tags: ['style', 'readability', 'analysis'],
    source: 'editorial-research',
  },
  {
    name: 'TextFixer',
    url: 'https://www.textfixer.com',
    category: 'writing',
    description:
      'A set of plain text tools for case conversion, sorting, cleaning and word counting.',
    tags: ['text-tools', 'convert', 'clean'],
    source: 'editorial-research',
  },

  // ── PDF & File Tools ─────────────────────────────────────────────────────
  {
    name: 'iLovePDF',
    url: 'https://www.ilovepdf.com',
    category: 'pdf-files',
    description:
      'Merges, splits, compresses, converts and signs PDF files without creating an account.',
    tags: ['pdf', 'merge', 'compress'],
    source: 'editorial-research',
  },
  {
    name: 'Smallpdf',
    url: 'https://smallpdf.com',
    category: 'pdf-files',
    description:
      'A set of PDF tools for conversion, compression, editing and e-signing in the browser.',
    tags: ['pdf', 'convert', 'sign'],
    source: 'editorial-research',
  },
  {
    name: 'PDF24 Tools',
    url: 'https://tools.pdf24.org',
    category: 'pdf-files',
    description:
      'Free PDF utilities including merge, split, OCR, compress and convert, with no registration.',
    tags: ['pdf', 'ocr', 'utilities'],
    source: 'editorial-research',
  },
  {
    name: 'TinyWow',
    url: 'https://tinywow.com',
    category: 'pdf-files',
    description:
      'Hundreds of free file tools for PDF, video, image and text problems, all without sign-up.',
    tags: ['files', 'convert', 'tools'],
    source: 'editorial-research',
  },
  {
    name: 'CloudConvert',
    url: 'https://cloudconvert.com',
    category: 'pdf-files',
    description:
      'Converts between more than 200 file formats, including documents, images, audio and video.',
    tags: ['converter', 'formats', 'documents'],
    source: 'editorial-research',
  },
  {
    name: 'Convertio',
    url: 'https://convertio.co',
    category: 'pdf-files',
    description:
      'An online file converter covering documents, images, audio, video and archives.',
    tags: ['converter', 'formats', 'files'],
    source: 'editorial-research',
  },
  {
    name: 'Sejda',
    url: 'https://www.sejda.com',
    category: 'pdf-files',
    description:
      'Edits, merges, splits and fills PDF forms online with desktop-level page controls.',
    tags: ['pdf', 'editor', 'forms'],
    source: 'editorial-research',
  },
  {
    name: 'PDF2Go',
    url: 'https://www.pdf2go.com',
    category: 'pdf-files',
    description:
      'Converts, compresses and edits PDFs and other documents in the browser.',
    tags: ['pdf', 'convert', 'compress'],
    source: 'editorial-research',
  },
  {
    name: 'file.io',
    url: 'https://www.file.io',
    category: 'pdf-files',
    description:
      'Uploads a file and returns a single-use download link that expires after it is fetched.',
    tags: ['file-sharing', 'temporary', 'links'],
    source: 'editorial-research',
  },

  // ── Privacy & Security ───────────────────────────────────────────────────
  {
    name: 'Have I Been Pwned',
    url: 'https://haveibeenpwned.com',
    category: 'privacy',
    description:
      'Checks whether an email address or password has appeared in a known data breach.',
    tags: ['breaches', 'passwords', 'email'],
    source: 'editorial-research',
  },
  {
    name: 'VirusTotal',
    url: 'https://www.virustotal.com',
    category: 'privacy',
    description:
      'Scans files and URLs with dozens of malware engines and shows community analysis.',
    tags: ['malware', 'scanner', 'files'],
    source: 'editorial-research',
  },
  {
    name: 'BrowserLeaks',
    url: 'https://browserleaks.com',
    category: 'privacy',
    description:
      'Shows exactly what your browser reveals about you through canvas, WebGL, fonts and IP.',
    tags: ['fingerprinting', 'browser', 'tests'],
    source: 'editorial-research',
  },
  {
    name: 'Cover Your Tracks',
    url: 'https://coveryourtracks.eff.org',
    category: 'privacy',
    description:
      'Tests how unique and trackable your browser fingerprint is, with practical hardening advice.',
    tags: ['fingerprinting', 'eff', 'tracking'],
    source: 'editorial-research',
  },
  {
    name: 'Privacy Guides',
    url: 'https://www.privacyguides.org',
    category: 'privacy',
    description:
      'Community-maintained, vendor-independent recommendations for privacy-respecting software and services.',
    tags: ['guides', 'recommendations', 'security'],
    source: 'editorial-research',
  },
  {
    name: 'SSL Labs',
    url: 'https://www.ssllabs.com/ssltest/',
    category: 'privacy',
    description:
      'Deeply analyses a site’s TLS configuration and grades its certificate and protocol setup.',
    tags: ['tls', 'certificates', 'audit'],
    source: 'editorial-research',
  },
  {
    name: 'DNS Leak Test',
    url: 'https://www.dnsleaktest.com',
    category: 'privacy',
    description:
      'Checks which DNS resolvers your connection is actually using and whether they leak.',
    tags: ['dns', 'vpn', 'leaks'],
    source: 'editorial-research',
  },
  {
    name: 'CryptPad',
    url: 'https://cryptpad.fr',
    category: 'privacy',
    description:
      'End-to-end encrypted documents, sheets, slides and pads that need no account for a trial pad.',
    tags: ['encrypted', 'documents', 'collaboration'],
    openSource: true,
    license: 'AGPL-3.0',
    repo: 'https://github.com/cryptpad/cryptpad',
    source: 'editorial-research',
  },
  {
    name: 'Wormhole',
    url: 'https://wormhole.app',
    category: 'privacy',
    description:
      'Sends files up to 10 GB through an end-to-end encrypted link that expires automatically.',
    tags: ['file-transfer', 'encrypted', 'sharing'],
    source: 'editorial-research',
  },
  {
    name: '10 Minute Mail',
    url: 'https://10minutemail.com',
    category: 'privacy',
    description:
      'Provides a disposable email address that receives mail instantly and expires automatically.',
    tags: ['temporary-email', 'disposable', 'signup'],
    source: 'editorial-research',
  },

  // ── Research & Investigation ─────────────────────────────────────────────
  {
    name: 'Internet Archive',
    url: 'https://archive.org',
    category: 'research',
    description:
      'A non-profit library of millions of free books, films, software, audio and archived web pages.',
    tags: ['archive', 'library', 'public-domain'],
    source: 'editorial-research',
  },
  {
    name: 'Wayback Machine',
    url: 'https://web.archive.org',
    category: 'research',
    description:
      'Shows historical snapshots of almost any web page and lets you search what changed.',
    tags: ['archive', 'history', 'web'],
    source: 'editorial-research',
  },
  {
    name: 'arXiv',
    url: 'https://arxiv.org',
    category: 'research',
    description:
      'An open-access archive of preprints in physics, mathematics, computer science and biology.',
    tags: ['papers', 'preprints', 'science'],
    source: 'editorial-research',
  },
  {
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    category: 'research',
    description:
      'An AI-powered academic search engine with citation context and paper summaries.',
    tags: ['papers', 'citations', 'academic'],
    source: 'editorial-research',
  },
  {
    name: 'OpenAlex',
    url: 'https://openalex.org',
    category: 'research',
    description:
      'A free, open catalogue of hundreds of millions of scholarly works, authors and institutions.',
    tags: ['open-data', 'scholarly', 'catalogue'],
    source: 'editorial-research',
  },
  {
    name: 'Connected Papers',
    url: 'https://www.connectedpapers.com',
    category: 'research',
    description:
      'Builds a visual graph of papers related to a seed paper so you can explore a field quickly.',
    tags: ['visualisation', 'papers', 'citations'],
    source: 'editorial-research',
  },
  {
    name: 'PubMed',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    category: 'research',
    description:
      'Searches millions of biomedical citations and abstracts from MEDLINE and life-science journals.',
    tags: ['biomedical', 'papers', 'medicine'],
    source: 'editorial-research',
  },
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    category: 'research',
    description:
      'Searches scholarly literature across disciplines and shows who cited each paper.',
    tags: ['academic', 'citations', 'search'],
    source: 'editorial-research',
  },
  {
    name: 'OpenSanctions',
    url: 'https://www.opensanctions.org',
    category: 'research',
    description:
      'Searches sanctions lists, politically exposed persons and watchlists from around the world.',
    tags: ['sanctions', 'osint', 'watchlists'],
    source: 'editorial-research',
  },
  {
    name: 'OpenCorporates',
    url: 'https://opencorporates.com',
    category: 'research',
    description:
      'Searches company records and directors across official registries in many jurisdictions.',
    tags: ['companies', 'registries', 'osint'],
    source: 'editorial-research',
  },
  {
    name: 'OSINT Framework',
    url: 'https://osintframework.com',
    category: 'research',
    description:
      'A browsable map of open-source intelligence resources organised by investigation type.',
    tags: ['osint', 'directory', 'investigation'],
    source: 'editorial-research',
  },

  // ── Education & Learning ─────────────────────────────────────────────────
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    category: 'education',
    description:
      'Free lessons and practice exercises in maths, science, computing and economics for all ages.',
    tags: ['courses', 'maths', 'free-learning'],
    source: 'editorial-research',
  },
  {
    name: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu',
    category: 'education',
    description:
      'Lecture notes, exams and videos from thousands of MIT courses, published freely.',
    tags: ['university', 'courses', 'videos'],
    source: 'editorial-research',
  },
  {
    name: 'OpenStax',
    url: 'https://openstax.org',
    category: 'education',
    description:
      'Peer-reviewed, openly licensed university textbooks you can read or download for free.',
    tags: ['textbooks', 'university', 'open-access'],
    source: 'editorial-research',
  },
  {
    name: 'Project Gutenberg',
    url: 'https://www.gutenberg.org',
    category: 'education',
    description:
      'Over 70,000 free public-domain ebooks in EPUB, Kindle and plain-text formats.',
    tags: ['ebooks', 'public-domain', 'literature'],
    source: 'editorial-research',
  },
  {
    name: 'Standard Ebooks',
    url: 'https://standardebooks.org',
    category: 'education',
    description:
      'Carefully edited, beautifully typeset public-domain ebooks free to download.',
    tags: ['ebooks', 'typography', 'public-domain'],
    source: 'editorial-research',
  },
  {
    name: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    category: 'education',
    description:
      'The free encyclopedia, with millions of articles in over 300 languages, readable without an account.',
    tags: ['encyclopedia', 'reference', 'community'],
    source: 'editorial-research',
  },
  {
    name: 'Desmos',
    url: 'https://www.desmos.com/calculator',
    category: 'education',
    description:
      'A graphing calculator that plots functions, tables and inequalities instantly.',
    tags: ['maths', 'graphing', 'calculator'],
    source: 'editorial-research',
  },
  {
    name: 'GeoGebra',
    url: 'https://www.geogebra.org/calculator',
    category: 'education',
    description:
      'Interactive geometry, algebra, statistics and calculus tools that run in the browser.',
    tags: ['maths', 'geometry', 'interactive'],
    source: 'editorial-research',
  },
  {
    name: 'PhET Simulations',
    url: 'https://phet.colorado.edu',
    category: 'education',
    description:
      'Interactive science and maths simulations from the University of Colorado Boulder.',
    tags: ['simulations', 'physics', 'science'],
    source: 'editorial-research',
  },
  {
    name: 'Mathigon',
    url: 'https://mathigon.org',
    category: 'education',
    description:
      'An interactive, visual mathematics textbook with explorable explanations and puzzles.',
    tags: ['maths', 'interactive', 'textbook'],
    source: 'editorial-research',
  },
  {
    name: 'Open Culture',
    url: 'https://www.openculture.com',
    category: 'education',
    description:
      'Curates free courses, audiobooks, films, language lessons and cultural archives from across the web.',
    tags: ['courses', 'culture', 'free-resources'],
    source: 'editorial-research',
  },

  // ── Science & Technology ────────────────────────────────────────────────
  {
    name: 'Earth Nullschool',
    url: 'https://earth.nullschool.net',
    category: 'science',
    description:
      'Visualises global wind, weather, ocean and pollution currents on an animated 3D globe.',
    tags: ['weather', 'visualisation', 'globe'],
    source: 'editorial-research',
  },
  {
    name: 'Windy',
    url: 'https://www.windy.com',
    category: 'science',
    description:
      'Detailed wind, rain, temperature and wave forecast maps from multiple weather models.',
    tags: ['weather', 'forecast', 'maps'],
    source: 'editorial-research',
  },
  {
    name: 'Ventusky',
    url: 'https://www.ventusky.com',
    category: 'science',
    description:
      'Animated weather maps showing wind, precipitation, temperature and pressure across the globe.',
    tags: ['weather', 'radar', 'maps'],
    source: 'editorial-research',
  },
  {
    name: 'Zoom Earth',
    url: 'https://zoom.earth',
    category: 'science',
    description:
      'Live satellite imagery, storm tracking and historical weather maps in one interface.',
    tags: ['satellite', 'storms', 'weather'],
    source: 'editorial-research',
  },
  {
    name: 'USGS Earthquake Map',
    url: 'https://earthquake.usgs.gov/earthquakes/map/',
    category: 'science',
    description:
      'Live and historical earthquake data from the United States Geological Survey on a world map.',
    tags: ['earthquakes', 'seismic', 'usgs'],
    source: 'editorial-research',
  },
  {
    name: 'NASA Astronomy Picture of the Day',
    url: 'https://apod.nasa.gov/apod/astropix.html',
    category: 'science',
    description:
      'A daily astronomy image with an expert-written explanation, archived back to 1995.',
    tags: ['astronomy', 'nasa', 'images'],
    source: 'editorial-research',
  },
  {
    name: 'NASA Image and Video Library',
    url: 'https://images.nasa.gov',
    category: 'science',
    description:
      'Searches NASA’s public image, video and audio archives with downloadable originals.',
    tags: ['nasa', 'space', 'media'],
    source: 'editorial-research',
  },
  {
    name: 'Stellarium Web',
    url: 'https://stellarium-web.org',
    category: 'science',
    description:
      'A realistic planetarium in the browser that shows the sky from your location right now.',
    tags: ['astronomy', 'planetarium', 'sky'],
    source: 'editorial-research',
  },
  {
    name: 'Periodic Table',
    url: 'https://ptable.com',
    category: 'science',
    description:
      'A detailed interactive periodic table with element properties, orbitals and isotopes.',
    tags: ['chemistry', 'elements', 'reference'],
    source: 'editorial-research',
  },
  {
    name: 'Solar System Scope',
    url: 'https://www.solarsystemscope.com',
    category: 'science',
    description:
      'An interactive 3D model of the solar system with real-time planetary positions.',
    tags: ['space', '3d', 'simulation'],
    source: 'editorial-research',
  },
  {
    name: 'PubChem',
    url: 'https://pubchem.ncbi.nlm.nih.gov',
    category: 'science',
    description:
      'Searches chemical compounds, properties, safety data and bioassays from the NIH.',
    tags: ['chemistry', 'compounds', 'database'],
    source: 'editorial-research',
  },
  {
    name: 'Lightning Maps',
    url: 'https://www.lightningmaps.org',
    category: 'science',
    description:
      'Shows live lightning strikes worldwide from a network of volunteer detectors.',
    tags: ['lightning', 'storms', 'live'],
    source: 'editorial-research',
  },

  // ── Data & Analytics ────────────────────────────────────────────────────
  {
    name: 'Our World in Data',
    url: 'https://ourworldindata.org',
    category: 'data',
    description:
      'Research and interactive charts on global poverty, health, energy, population and the environment.',
    tags: ['charts', 'research', 'global'],
    source: 'editorial-research',
  },
  {
    name: 'Google Trends',
    url: 'https://trends.google.com',
    category: 'data',
    description:
      'Explores how often terms are searched over time and by region, with comparison charts.',
    tags: ['trends', 'search', 'analysis'],
    source: 'editorial-research',
  },
  {
    name: 'Gapminder Tools',
    url: 'https://www.gapminder.org/tools/',
    category: 'data',
    description:
      'Animated bubble charts that let you explore how countries changed across income and health.',
    tags: ['visualisation', 'statistics', 'countries'],
    source: 'editorial-research',
  },
  {
    name: 'RawGraphs',
    url: 'https://www.rawgraphs.io',
    category: 'data',
    description:
      'Creates unusual data visualisations from spreadsheets and exports them as SVG or images.',
    tags: ['charts', 'visualisation', 'csv'],
    openSource: true,
    license: 'Apache-2.0',
    repo: 'https://github.com/rawgraphs/rawgraphs-app',
    source: 'github-topics',
  },
  {
    name: 'SankeyMATIC',
    url: 'https://sankeymatic.com',
    category: 'data',
    description:
      'Builds Sankey diagrams by typing a simple list of flows and downloads the result as SVG.',
    tags: ['sankey', 'flow', 'diagrams'],
    source: 'editorial-research',
  },
  {
    name: 'Vega Editor',
    url: 'https://vega.github.io/editor/',
    category: 'data',
    description:
      'A live editor for Vega and Vega-Lite charts with examples, export and shareable specs.',
    tags: ['charts', 'vega', 'grammar-of-graphics'],
    openSource: true,
    license: 'BSD-3-Clause',
    repo: 'https://github.com/vega/editor',
    source: 'github-topics',
  },
  {
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org',
    category: 'data',
    description:
      'Free access to global development indicators with charts, maps and bulk downloads.',
    tags: ['datasets', 'economics', 'development'],
    source: 'editorial-research',
  },
  {
    name: 'Data Commons',
    url: 'https://datacommons.org',
    category: 'data',
    description:
      'Explores public statistical data about places, people and economies in one knowledge graph.',
    tags: ['statistics', 'knowledge-graph', 'explorer'],
    source: 'editorial-research',
  },

  // ── Maps & Geography ────────────────────────────────────────────────────
  {
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    category: 'maps',
    description:
      'The open world map built by volunteers, with layers, routing and raw map data.',
    tags: ['open-data', 'mapping', 'community'],
    source: 'editorial-research',
  },
  {
    name: 'Overpass Turbo',
    url: 'https://overpass-turbo.eu',
    category: 'maps',
    description:
      'Queries OpenStreetMap data with the Overpass API and shows results on a map or as exportable data.',
    tags: ['openstreetmap', 'query', 'geodata'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/tyrasd/overpass-turbo',
    source: 'github-topics',
  },
  {
    name: 'geojson.io',
    url: 'https://geojson.io',
    category: 'maps',
    description:
      'Draws points, lines and polygons on a map and exports the result as GeoJSON, CSV or KML.',
    tags: ['geojson', 'drawing', 'geodata'],
    source: 'editorial-research',
  },
  {
    name: 'SunCalc',
    url: 'https://www.suncalc.org',
    category: 'maps',
    description:
      'Shows the sun’s path, sunrise, sunset and shadow direction for any place and date.',
    tags: ['sun', 'astronomy', 'planning'],
    source: 'editorial-research',
  },
  {
    name: 'What3Words',
    url: 'https://what3words.com',
    category: 'maps',
    description:
      'Gives every three-metre square on Earth a unique three-word address you can share.',
    tags: ['addresses', 'location', 'geocoding'],
    source: 'editorial-research',
  },
  {
    name: 'OpenRailwayMap',
    url: 'https://www.openrailwaymap.org',
    category: 'maps',
    description:
      'A detailed map of railway infrastructure, track types, signals and operating speeds.',
    tags: ['railways', 'infrastructure', 'map'],
    source: 'editorial-research',
  },
  {
    name: 'PeakFinder',
    url: 'https://www.peakfinder.com',
    category: 'maps',
    description:
      'Labels every mountain peak visible from any point on Earth with a 360-degree panorama.',
    tags: ['mountains', 'panorama', 'outdoors'],
    source: 'editorial-research',
  },
  {
    name: 'Old Maps Online',
    url: 'https://www.oldmapsonline.org',
    category: 'maps',
    description:
      'Searches historical maps from archives worldwide by place and overlays them on a modern map.',
    tags: ['history', 'archives', 'maps'],
    source: 'editorial-research',
  },
  {
    name: 'GPS Visualizer',
    url: 'https://www.gpsvisualizer.com',
    category: 'maps',
    description:
      'Plots GPS tracks and coordinates on maps or elevation profiles and converts between formats.',
    tags: ['gps', 'elevation', 'conversion'],
    source: 'editorial-research',
  },

  // ── Internet & Networking ───────────────────────────────────────────────
  {
    name: 'DNS Checker',
    url: 'https://dnschecker.org',
    category: 'internet',
    description:
      'Checks how a domain resolves from DNS servers around the world and verifies records.',
    tags: ['dns', 'propagation', 'records'],
    source: 'editorial-research',
  },
  {
    name: 'MXToolbox',
    url: 'https://mxtoolbox.com',
    category: 'internet',
    description:
      'Diagnoses email and DNS problems, including MX records, blacklists and SMTP tests.',
    tags: ['email', 'dns', 'diagnostics'],
    source: 'editorial-research',
  },
  {
    name: 'BGP Toolkit',
    url: 'https://bgp.he.net',
    category: 'internet',
    description:
      'Looks up autonomous systems, IP prefixes and internet exchange points behind a network.',
    tags: ['bgp', 'routing', 'networking'],
    source: 'editorial-research',
  },
  {
    name: 'Speedtest',
    url: 'https://www.speedtest.net',
    category: 'internet',
    description:
      'Measures download, upload and latency against nearby servers with a single click.',
    tags: ['bandwidth', 'latency', 'speed'],
    source: 'editorial-research',
  },
  {
    name: 'Down For Everyone Or Just Me',
    url: 'https://downforeveryoneorjustme.com',
    category: 'internet',
    description:
      'Tells you whether a site is down for everybody or only unreachable from your connection.',
    tags: ['uptime', 'outage', 'checks'],
    source: 'editorial-research',
  },
  {
    name: 'IPinfo',
    url: 'https://ipinfo.io',
    category: 'internet',
    description:
      'Shows your public IP address with its approximate location, network and ASN details.',
    tags: ['ip', 'geolocation', 'network'],
    source: 'editorial-research',
  },
  {
    name: 'Security Headers',
    url: 'https://securityheaders.com',
    category: 'internet',
    description:
      'Grades a website’s HTTP security headers and explains what each missing header exposes.',
    tags: ['security', 'headers', 'audit'],
    source: 'editorial-research',
  },
  {
    name: 'Test IPv6',
    url: 'https://test-ipv6.com',
    category: 'internet',
    description:
      'Reports your IPv4 and IPv6 connectivity, addresses and readiness in plain language.',
    tags: ['ipv6', 'connectivity', 'diagnostics'],
    source: 'editorial-research',
  },

  // ── Calculators & Converters ────────────────────────────────────────────
  {
    name: 'Omni Calculator',
    url: 'https://www.omnicalculator.com',
    category: 'calculators',
    description:
      'Thousands of focused calculators for finance, health, science, construction and daily life.',
    tags: ['calculators', 'finance', 'health'],
    source: 'editorial-research',
  },
  {
    name: 'Calculator.net',
    url: 'https://www.calculator.net',
    category: 'calculators',
    description:
      'A wide set of free calculators covering maths, finance, fitness, dates and conversions.',
    tags: ['calculators', 'maths', 'finance'],
    source: 'editorial-research',
  },
  {
    name: 'Wolfram Alpha',
    url: 'https://www.wolframalpha.com',
    category: 'calculators',
    description:
      'Answers computational questions with worked steps, plots and curated facts.',
    tags: ['maths', 'computation', 'knowledge'],
    source: 'editorial-research',
  },
  {
    name: 'Time and Date',
    url: 'https://www.timeanddate.com',
    category: 'calculators',
    description:
      'World clocks, timezone conversion, calendars, countdowns and sunrise tables for any city.',
    tags: ['timezones', 'calendar', 'world-clock'],
    source: 'editorial-research',
  },
  {
    name: 'XE Currency Converter',
    url: 'https://www.xe.com/currencyconverter/',
    category: 'calculators',
    description:
      'Converts between 130+ currencies using live mid-market exchange rates.',
    tags: ['currency', 'exchange-rates', 'finance'],
    source: 'editorial-research',
  },
  {
    name: 'World Time Buddy',
    url: 'https://www.worldtimebuddy.com',
    category: 'calculators',
    description:
      'Compares several timezones side by side to find a meeting slot that works everywhere.',
    tags: ['timezones', 'meetings', 'scheduling'],
    source: 'editorial-research',
  },
  {
    name: 'RapidTables',
    url: 'https://www.rapidtables.com',
    category: 'calculators',
    description:
      'Reference tables and converters for units, number bases, electrical values and colour codes.',
    tags: ['conversion', 'tables', 'reference'],
    source: 'editorial-research',
  },
  {
    name: 'DOF Simulator',
    url: 'https://dofsimulator.net/en/',
    category: 'calculators',
    description:
      'Previews depth of field and background blur for a given camera, lens, aperture and distance.',
    tags: ['photography', 'depth-of-field', 'visualisation'],
    source: 'editorial-research',
  },

  // ── Browser Applications ────────────────────────────────────────────────
  {
    name: 'draw.io',
    url: 'https://app.diagrams.net',
    category: 'browser-apps',
    description:
      'A full diagramming application for flowcharts, UML, network and cloud architecture diagrams.',
    tags: ['diagrams', 'flowcharts', 'offline'],
    openSource: true,
    license: 'Apache-2.0',
    repo: 'https://github.com/jgraph/drawio',
    source: 'github-topics',
  },
  {
    name: 'JS Paint',
    url: 'https://jspaint.app',
    category: 'browser-apps',
    description:
      'A faithful browser recreation of MS Paint with working tools, palettes and file saving.',
    tags: ['paint', 'nostalgia', 'drawing'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/1j01/jspaint',
    source: 'github-topics',
  },
  {
    name: 'BeepBox',
    url: 'https://www.beepbox.co',
    category: 'browser-apps',
    description:
      'A tiny browser synthesizer for sketching chiptune melodies and exporting them as WAV or links.',
    tags: ['music', 'chiptune', 'synth'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/johnnesky/beepbox',
    source: 'github-topics',
  },
  {
    name: 'Chrome Music Lab',
    url: 'https://musiclab.chromeexperiments.com',
    category: 'browser-apps',
    description:
      'Hands-on musical experiments for exploring rhythm, harmony, pitch and sound waves.',
    tags: ['music', 'education', 'experiments'],
    source: 'editorial-research',
  },
  {
    name: 'vscode.dev',
    url: 'https://vscode.dev',
    category: 'browser-apps',
    description:
      'Visual Studio Code in a browser tab, able to open local folders with full editing and IntelliSense.',
    tags: ['code-editor', 'ide', 'offline'],
    openSource: true,
    license: 'MIT',
    repo: 'https://github.com/microsoft/vscode',
    source: 'github-topics',
  },
  {
    name: 'Riseup Pad',
    url: 'https://pad.riseup.net',
    category: 'browser-apps',
    description:
      'An anonymous collaborative Etherpad for real-time shared notes with no account required.',
    tags: ['collaboration', 'notes', 'anonymous'],
    openSource: true,
    license: 'Apache-2.0',
    repo: 'https://github.com/ether/etherpad-lite',
    source: 'editorial-research',
  },
  {
    name: 'Lichess Analysis',
    url: 'https://lichess.org/analysis',
    category: 'browser-apps',
    description:
      'A free, open-source chess analysis board with engine evaluation and move databases.',
    tags: ['chess', 'analysis', 'open-source'],
    openSource: true,
    license: 'AGPL-3.0',
    repo: 'https://github.com/lichess-org/lila',
    source: 'github-topics',
  },

  // ── Business & Finance ──────────────────────────────────────────────────
  {
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com',
    category: 'business',
    description:
      'Live quotes, charts, financial statements and news for stocks, funds, currencies and crypto.',
    tags: ['markets', 'stocks', 'news'],
    source: 'editorial-research',
  },
  {
    name: 'TradingView',
    url: 'https://www.tradingview.com',
    category: 'business',
    description:
      'Advanced interactive charts with technical indicators for markets worldwide.',
    tags: ['charts', 'markets', 'technical-analysis'],
    source: 'editorial-research',
  },
  {
    name: 'Finviz',
    url: 'https://finviz.com',
    category: 'business',
    description:
      'A stock screener, heatmap and news feed for filtering US equities by financial metrics.',
    tags: ['screener', 'stocks', 'heatmap'],
    source: 'editorial-research',
  },
  {
    name: 'SEC EDGAR Search',
    url: 'https://www.sec.gov/edgar/search/',
    category: 'business',
    description:
      'Searches official filings from US public companies, funds and insiders.',
    tags: ['filings', 'sec', 'company-data'],
    source: 'editorial-research',
  },
  {
    name: 'Companies House',
    url: 'https://find-and-update.company-information.service.gov.uk',
    category: 'business',
    description:
      'Looks up UK company records, accounts, officers and filing history from the official register.',
    tags: ['uk', 'company-data', 'official'],
    source: 'editorial-research',
  },
  {
    name: 'Numbeo',
    url: 'https://www.numbeo.com',
    category: 'business',
    description:
      'Compares cost of living, rent, crime and quality of life between cities and countries.',
    tags: ['cost-of-living', 'cities', 'statistics'],
    source: 'editorial-research',
  },
  {
    name: 'CoinGecko',
    url: 'https://www.coingecko.com',
    category: 'business',
    description:
      'Tracks cryptocurrency prices, market caps and volumes across thousands of coins and exchanges.',
    tags: ['crypto', 'markets', 'prices'],
    source: 'editorial-research',
  },
  {
    name: 'Wise Currency Converter',
    url: 'https://wise.com/gb/currency-converter/',
    category: 'business',
    description:
      'Converts currencies using the mid-market rate and shows the real cost of transfers.',
    tags: ['currency', 'exchange-rates', 'transfers'],
    source: 'editorial-research',
  },
  {
    name: 'Portfolio Visualizer',
    url: 'https://www.portfoliovisualizer.com',
    category: 'business',
    description:
      'Backtests portfolios and analyses asset allocation and risk with historical market data.',
    tags: ['investing', 'backtesting', 'portfolio'],
    source: 'editorial-research',
  },

  // ── Interesting & Unusual ───────────────────────────────────────────────
  {
    name: 'Radio Garden',
    url: 'https://radio.garden',
    category: 'unusual',
    description:
      'Spin a globe and tune into live radio stations from cities and villages worldwide.',
    tags: ['radio', 'music', 'world'],
    source: 'editorial-research',
  },
  {
    name: 'Neal.fun',
    url: 'https://neal.fun',
    category: 'unusual',
    description:
      'Playful interactive experiments such as the deep sea, size of space and draw a perfect circle.',
    tags: ['interactive', 'experiments', 'play'],
    source: 'editorial-research',
  },
  {
    name: 'Windows 93',
    url: 'https://www.windows93.net',
    category: 'unusual',
    description:
      'A surreal, fully interactive parody desktop operating system that runs in the browser.',
    tags: ['retro', 'parody', 'play'],
    source: 'editorial-research',
  },
  {
    name: 'The Useless Web',
    url: 'https://theuselessweb.com',
    category: 'unusual',
    description:
      'Sends you to a random pointless website with one button and no explanation.',
    tags: ['random', 'fun', 'discovery'],
    source: 'editorial-research',
  },
  {
    name: 'Pointer Pointer',
    url: 'https://pointerpointer.com',
    category: 'unusual',
    description:
      'Put your cursor anywhere on the page and a photo of someone pointing at exactly that spot appears.',
    tags: ['fun', 'photos', 'one-trick'],
    source: 'editorial-research',
  },
  {
    name: 'Patatap',
    url: 'https://www.patatap.com',
    category: 'unusual',
    description:
      'Press any key to trigger animated shapes and sounds in a tiny audiovisual instrument.',
    tags: ['sound', 'animation', 'play'],
    source: 'editorial-research',
  },
  {
    name: 'Hacker Typer',
    url: 'https://hackertyper.net',
    category: 'unusual',
    description:
      'Type anything and convincing hacker code appears on screen, ready for a film scene.',
    tags: ['fun', 'code', 'novelty'],
    source: 'editorial-research',
  },
  {
    name: 'The Scale of the Universe',
    url: 'https://htwins.net/scale2/',
    category: 'unusual',
    description:
      'Zooms from quantum particles to the observable universe with beautifully illustrated scale comparisons.',
    tags: ['science', 'scale', 'interactive'],
    source: 'editorial-research',
  },
  {
    name: 'A Soft Murmur',
    url: 'https://asoftmurmur.com',
    category: 'unusual',
    description:
      'Mixes rain, thunder, waves and other ambient sounds into a personal background soundscape.',
    tags: ['ambient', 'focus', 'sound'],
    source: 'editorial-research',
  },
  {
    name: 'Apollo 11 in Real Time',
    url: 'https://apolloinrealtime.org',
    category: 'unusual',
    description:
      'Replays the Apollo 11 mission with synchronised audio, video, transcripts and spacecraft telemetry.',
    tags: ['space', 'history', 'archive'],
    source: 'editorial-research',
  },
  {
    name: 'Zoomquilt',
    url: 'https://zoomquilt.org',
    category: 'unusual',
    description:
      'An infinite zoom through a surreal painting that loops forever as you watch.',
    tags: ['art', 'animation', 'infinite'],
    source: 'editorial-research',
  },
  {
    name: 'Music for Programming',
    url: 'https://musicforprogramming.net',
    category: 'unusual',
    description:
      'Long, carefully sequenced mixes designed for deep work and coding sessions.',
    tags: ['music', 'focus', 'mixes'],
    source: 'editorial-research',
  },
];
