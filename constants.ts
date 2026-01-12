
import { ModelConfig, Gem, AppLanguage } from './types';

export const DEFAULT_MODEL = 'sonar';
export const NEW_CONVERSATION_ID = 'new';
export const YOUTUBE_API_KEY = "AIzaSyBq7P2exSAEIi4EADrmcv8lbYLfc3bnPH4";

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Perplexity
  { id: 'sonar', name: 'Sonar', description: 'Perplexity: Fast online search', provider: 'perplexity' },
  { id: 'sonar-pro', name: 'Sonar Pro', description: 'Perplexity: Deep research & reasoning', provider: 'perplexity' },
  // Google
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Google: Next-gen fast model', provider: 'google' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Google: Next-gen reasoning', provider: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Google: Versatile & Efficient (Maps)', provider: 'google' },
  { id: 'gemini-2.5-flash-native-audio-preview-12-2025', name: 'Gemini Audio', description: 'Google: Native Audio Generation', provider: 'google' },
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI: Most advanced standard model', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI: Efficient & fast', provider: 'openai' },
  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Anthropic: Best for coding & nuance', provider: 'anthropic' },
  // Local
  { id: 'llama3', name: 'Llama 3 (Local)', description: 'Ollama: Local privacy-focused model', provider: 'ollama' }
];

export const MODE_PROMPTS: Record<string, string> = {
  concise: "Be precise, concise, and direct in your answers.",
  academic: "You are an academic researcher. Provide detailed, technical answers with heavy reliance on citations. Use formal language.",
  writing: "You are a creative writing assistant. Focus on flow, style, and engaging narrative. You can be more verbose.",
  copilot: "You are a helpful co-pilot. Break down complex problems into steps and ask clarifying questions if necessary.",
  "deep-research": "You are a Deep Research Agent. Your goal is to exhaustively research the user's query.",
  presentation: `You are a Presentation Expert. Generate a slide deck based on the user's request. 
  RETURN JSON ONLY. The format must be exactly:
  {
    "slides": [
      { "title": "Slide Title", "content": ["Bullet 1", "Bullet 2"], "note": "Speaker notes" }
    ]
  }
  Do not include markdown formatting like \`\`\`json.`,
  analyst: `You are a Data Analyst. I will provide data in CSV/JSON format. 
  Analyze it and identify trends. 
  If appropriate, output a JSON object for a chart inside a code block tagged 'json-chart'.
  Format: { "type": "bar|line|area|pie", "title": "Chart Title", "data": [{"name": "A", "value": 10}, ...], "xKey": "name", "yKeys": ["value"] }`,
  arena: "You are a competitor in a model arena. Give your absolute best, most accurate answer.",
  quiz: `You are a Quiz Generator. Create a multiple-choice quiz based on the user request.
  RETURN JSON ONLY. The format must be exactly:
  {
    "title": "Quiz Title",
    "questions": [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Option A",
        "explanation": "Brief explanation of why this is correct."
      }
    ]
  }
  Do not include markdown formatting like \`\`\`json.`,
  flashcards: `You are a Flashcard Generator. Create a set of flashcards based on the user request.
  RETURN JSON ONLY. The format must be exactly:
  {
    "title": "Deck Title",
    "cards": [
      { "front": "Term or Question", "back": "Definition or Answer" }
    ]
  }
  Do not include markdown formatting like \`\`\`json.`
};

export const FOLLOW_UP_INSTRUCTION = `
At the VERY END of your response, provide exactly 3 suggested follow-up questions.
Format:
[[SUGGESTIONS]]
1. Question 1
2. Question 2
3. Question 3
`;

export const API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    newResearch: "New Research",
    openCanvas: "Open Canvas",
    chats: "Chats",
    gems: "Gems",
    folders: "Folders",
    recent: "Recent",
    tools: "Tools",
    quizMaker: "Quiz Maker",
    knowledgeGraph: "Knowledge Graph",
    createWorkspace: "Create Workspace",
    searchPlaceholder: "Ask anything...",
    listening: "Listening...",
    controlCenter: "Control Center",
    memory: "Memory",
    promptTemplates: "Prompt Templates",
    researchTools: "Research Tools & Modes"
  },
  es: {
    newResearch: "Nueva Búsqueda",
    openCanvas: "Abrir Lienzo",
    chats: "Chats",
    gems: "Gemas",
    folders: "Carpetas",
    recent: "Recientes",
    tools: "Herramientas",
    quizMaker: "Creador de Cuestionarios",
    knowledgeGraph: "Gráfico de Conocimiento",
    createWorkspace: "Crear Espacio de Trabajo",
    searchPlaceholder: "Pregunta lo que sea...",
    listening: "Escuchando...",
    controlCenter: "Centro de Control",
    memory: "Memoria",
    promptTemplates: "Plantillas de Preguntas",
    researchTools: "Herramientas de Investigación"
  },
  fr: {
    newResearch: "Nouvelle Recherche",
    openCanvas: "Ouvrir Canvas",
    chats: "Discussions",
    gems: "Joyaux",
    folders: "Dossiers",
    recent: "Récents",
    tools: "Outils",
    quizMaker: "Créateur de Quiz",
    knowledgeGraph: "Graphe de Connaissances",
    createWorkspace: "Créer un Espace",
    searchPlaceholder: "Demandez n'importe quoi...",
    listening: "Écoute...",
    controlCenter: "Centre de Contrôle",
    memory: "Mémoire",
    promptTemplates: "Modèles de Prompts",
    researchTools: "Outils de Recherche"
  },
  de: {
    newResearch: "Neue Forschung",
    openCanvas: "Canvas Öffnen",
    chats: "Chats",
    gems: "Juwelen",
    folders: "Ordner",
    recent: "Kürzlich",
    tools: "Werkzeuge",
    quizMaker: "Quiz-Ersteller",
    knowledgeGraph: "Wissensgraph",
    createWorkspace: "Arbeitsbereich Erstellen",
    searchPlaceholder: "Frag alles...",
    listening: "Zuhören...",
    controlCenter: "Kontrollzentrum",
    memory: "Gedächtnis",
    promptTemplates: "Prompt-Vorlagen",
    researchTools: "Forschungstools"
  },
  ja: {
    newResearch: "新規検索",
    openCanvas: "キャンバスを開く",
    chats: "チャット",
    gems: "ジェム",
    folders: "フォルダ",
    recent: "最近",
    tools: "ツール",
    quizMaker: "クイズ作成",
    knowledgeGraph: "ナレッジグラフ",
    createWorkspace: "ワークスペース作成",
    searchPlaceholder: "何でも聞いてください...",
    listening: "聞いています...",
    controlCenter: "コントロールセンター",
    memory: "メモリ",
    promptTemplates: "プロンプトテンプレート",
    researchTools: "リサーチツール"
  },
  zh: {
    newResearch: "新搜索",
    openCanvas: "打开画布",
    chats: "聊天",
    gems: "宝石",
    folders: "文件夹",
    recent: "最近",
    tools: "工具",
    quizMaker: "测验制作器",
    knowledgeGraph: "知识图谱",
    createWorkspace: "创建工作区",
    searchPlaceholder: "随便问...",
    listening: "正在听...",
    controlCenter: "控制中心",
    memory: "记忆",
    promptTemplates: "提示模板",
    researchTools: "研究工具"
  },
  ar: {
    newResearch: "بحث جديد",
    openCanvas: "فتح اللوحة",
    chats: "المحادثات",
    gems: "الجواهر",
    folders: "المجلدات",
    recent: "الأخيرة",
    tools: "الأدوات",
    quizMaker: "صانع الاختبارات",
    knowledgeGraph: "الرسم البياني للمعرفة",
    createWorkspace: "إنشاء مساحة عمل",
    searchPlaceholder: "اسأل أي شيء...",
    listening: "جاري الاستماع...",
    controlCenter: "مركز التحكم",
    memory: "الذاكرة",
    promptTemplates: "قوالب التلقين",
    researchTools: "أدوات البحث والأنماط"
  }
};

export const PROMPT_TEMPLATES = [
  {
    category: 'Analysis',
    prompts: [
      { title: 'SWOT Analysis', text: 'Conduct a detailed SWOT analysis for [Company/Product].' },
      { title: 'Market Research', text: 'Provide a comprehensive market analysis for [Industry/Topic].' },
    ]
  },
  {
    category: 'Coding',
    prompts: [
      { title: 'Code Review', text: 'Review this code for best practices and security vulnerabilities:\n\n' },
      { title: 'Web App', text: 'Create a single-file HTML/JS web application that does [Function].' },
    ]
  }
];

export const DEFAULT_GEMS: Gem[] = [
  { id: 'coding-wizard', name: 'Code Wizard', description: 'Expert Full-Stack Developer', icon: '💻', systemPrompt: 'You are an expert Senior Software Engineer.' },
  { id: 'creative-muse', name: 'Creative Muse', description: 'Storytelling & Ideation', icon: '🎨', systemPrompt: 'You are a creative writing partner.' },
  { id: 'data-analyst', name: 'Data Analyst', description: 'Insights from raw data', icon: '📊', systemPrompt: 'You are a Data Analyst.' },
];

export const DEFAULT_WORKSPACES = [
  { id: 'personal', name: 'Personal', icon: 'User', members: [], createdAt: Date.now() },
  { id: 'work', name: 'Work', icon: 'Briefcase', members: [], createdAt: Date.now() }
];
