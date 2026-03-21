import { useState, useMemo } from 'react';
import { Search, Book, Code2, PlayCircle, ArrowRight, X, Menu, ChevronRight } from 'lucide-react';
import { documentationData } from '../data/documentationData';

// Custom syntax highlighter simulation for beautiful output without external deps
const CodeBlock = ({ language, code }) => {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#1e1e1e] border border-white/10 my-4 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
          {language}
        </span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
        </div>
      </div>
      <pre className="p-5 overflow-x-auto text-sm font-mono leading-relaxed text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [selectedTopicId, setSelectedTopicId] = useState(documentationData['javascript'].topics[0].id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute filtered topics based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    let results = [];
    const query = searchQuery.toLowerCase();
    
    Object.entries(documentationData).forEach(([langKey, langData]) => {
      langData.topics.forEach(topic => {
        const matchesTitle = topic.title.toLowerCase().includes(query);
        const matchesContent = topic.content.some(block => 
          (block.type === 'paragraph' && block.value.toLowerCase().includes(query)) ||
          (block.type === 'code' && block.value.toLowerCase().includes(query))
        );
        
        if (matchesTitle || matchesContent) {
          results.push({
            langKey,
            langName: langData.name,
            langIcon: langData.icon,
            topic
          });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const activeLangData = documentationData[selectedLang];
  const activeTopic = activeLangData.topics.find(t => t.id === selectedTopicId) || activeLangData.topics[0];

  const handleSelectTopic = (langKey, topicId) => {
    setSelectedLang(langKey);
    setSelectedTopicId(topicId);
    setSearchQuery(''); // clear search on selection
    setMobileMenuOpen(false);
  };

  // Render the markdown-style blocks
  const renderContent = (contentBlocks) => {
    return contentBlocks.map((block, idx) => {
      if (block.type === 'paragraph') {
        // highlight inline code snippets using regex (e.g. `var`)
        const parts = block.value.split(/`([^`]+)`/g);
        return (
          <p key={idx} className="text-gray-300 leading-relaxed mb-4">
            {parts.map((part, i) => 
              i % 2 === 1 ? (
                <span key={i} className="bg-white/10 text-primary-light px-1.5 py-0.5 rounded-md font-mono text-sm border border-white/5">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        );
      } else if (block.type === 'code') {
        return <CodeBlock key={idx} language={block.language} code={block.value} />;
      }
      return null;
    });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 sm:gap-6 animate-fade-in relative max-w-7xl mx-auto w-full">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-xl border border-white/20 text-white"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Navigation */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 
        transform transition-transform duration-300 ease-in-out
        glass-card rounded-2xl border border-white/5 flex flex-col h-full overflow-hidden shadow-2xl lg:shadow-none
        mt-[80px] lg:mt-0
      `}>
        {/* Search Bar */}
        <div className="p-4 border-b border-white/5 bg-black/20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search documentation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white placeholder-gray-500 shadow-inner"
            />
          </div>
        </div>

        {/* Sidebar Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
          {searchResults ? (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest pl-2 mb-3">Search Results</h3>
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 pl-2">No results found for "{searchQuery}"</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result, idx) => (
                    <button 
                      key={`${result.langKey}-${result.topic.id}-${idx}`}
                      onClick={() => handleSelectTopic(result.langKey, result.topic.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{result.langIcon}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{result.langName}</span>
                      </div>
                      <p className="text-sm font-semibold text-white group-hover:text-primary-light transition-colors">{result.topic.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(documentationData).map(([langKey, langData]) => (
                <div key={langKey}>
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <span>{langData.icon}</span>
                    <h3 className="text-sm font-black uppercase text-gray-300 tracking-wider">
                      {langData.name}
                    </h3>
                  </div>
                  <div className="space-y-1 pl-3 border-l-2 border-white/5 ml-4">
                    {langData.topics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => handleSelectTopic(langKey, topic.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          selectedLang === langKey && selectedTopicId === topic.id 
                            ? 'bg-primary/20 text-primary-light font-bold border border-primary/20 shadow-sm' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {selectedLang === langKey && selectedTopicId === topic.id ? (
                          <ChevronRight size={14} />
                        ) : (
                          <span className="w-[14px]"></span>
                        )}
                        {topic.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col relative z-0">
        
        {/* Background glow specific to main content */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        
        {/* Header Breadcrumb & Info */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 bg-black/20 flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <Book size={14} className="text-primary-light" />
            <span>Documentation</span>
            <ChevronRight size={12} />
            <span className="flex items-center gap-1">
              {activeLangData.icon} {activeLangData.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            {activeTopic.title}
          </h1>
        </div>

        {/* Content Render Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative z-10">
          <div className="max-w-3xl animate-slide-up">
            
            {/* If intro topic, show language description */}
            {activeTopic.id.startsWith('intro-') && (
              <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-primary-light/90 font-medium">
                {activeLangData.description}
              </div>
            )}
            
            {renderContent(activeTopic.content)}

            {/* Pagination / Next Topic hint */}
            <div className="mt-12 pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Was this helpful?</span>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-gray-400 hover:bg-white/10 transition-colors">Yes</button>
                <button className="px-4 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-gray-400 hover:bg-white/10 transition-colors">No</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
