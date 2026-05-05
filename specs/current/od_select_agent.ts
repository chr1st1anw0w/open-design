const TASK_AGENT_ROUTING = {
  // 程式碼任務 → codex 優先
  keywords: ['重構', '實作', '修bug', 'refactor', 'implement', 'fix'],
  agent: 'codex',
  
  // 分析/審查 → claude 優先  
  keywords: ['分析', '審查', '解釋', 'analyze', 'review', 'explain'],
  agent: 'claude-code',
  
  // 搜尋/研究 → gemini 優先
  keywords: ['搜尋', '研究', '最新', 'search', 'research', 'latest'],
  agent: 'gemini',
  
  // 設計任務 → pi 優先（支援 reasoning）
  keywords: ['設計', '規劃', '架構', 'design', 'plan', 'architecture'],
  agent: 'pi',
};
