import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiFileText, FiArrowRight, FiEdit2, FiCopy, FiCheck, FiLinkedin, FiTwitter, FiInstagram } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PlatformTab from '../../components/dashboard/PlatformTab';
import GenerateContentModal from '../../components/content/GenerateContentModal';
import IdeasLoadingSpinner from '../../components/content/IdeasLoadingSpinner';
import QuickEditModal from '../../components/content/QuickEditModal';
import DeleteConfirmModal from '../../components/content/DeleteConfirmModal';
import FloatingDeleteButton from '../../components/common/FloatingDeleteButton';
import FunnelStageBadge from '../../components/platform/FunnelStageBadge';
import PlatformIcon from '../../components/platform/PlatformIcon';
import { getIdeas, createIdea, updateIdea, deleteIdea, getIdeasCount } from '../../services/ideasService';
import { generateIdeasContent } from '../../services/ideasContentService';

const platforms = [
  { icon: <FiLinkedin className="w-4 h-4" />, text: 'LinkedIn' },
  { icon: <FiTwitter className="w-4 h-4" />, text: 'Twitter Post' },
  { icon: <FiInstagram className="w-4 h-4" />, text: 'Instagram' }
];

const FUNNEL_STAGES = {
  'TOFU': 'Top of Funnel',
  'MOFU': 'Middle of Funnel',
  'BOFU': 'Bottom of Funnel'
};

export default function Ideas() {
  const [activePlatform, setActivePlatform] = useState('LinkedIn');
  const [selectedStage, setSelectedStage] = useState('TOFU');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [editingIdea, setEditingIdea] = useState(null);
  const [showCopied, setShowCopied] = useState(null);
  const [platformCounts, setPlatformCounts] = useState({});
  const [generatingContent, setGeneratingContent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadIdeas();
    updatePlatformCounts();
  }, [activePlatform]);

  const loadIdeas = async () => {
    try {
      const data = await getIdeas(activePlatform);
      setIdeas(data || []);
      setSelectedIdeas(new Set()); // Clear selections when ideas are reloaded
    } catch (err) {
      console.error('Error loading ideas:', err);
      setError('Failed to load ideas');
    }
  };

  const updatePlatformCounts = async () => {
    const counts = {};
    for (const platform of platforms) {
      try {
        counts[platform.text] = await getIdeasCount(platform.text);
      } catch (err) {
        console.error(`Error getting count for ${platform.text}:`, err);
      }
    }
    setPlatformCounts(counts);
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        const remainingProgress = 90 - prev;
        const increment = Math.max(0.5, Math.min(2, remainingProgress * 0.05));
        return Math.min(90, prev + increment);
      });
    }, 400);
    return interval;
  };

  const handleGenerateIdeas = async (e) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);
      const progressInterval = simulateProgress();

      const savedIdea = await createIdea(topic, activePlatform, selectedStage);
      
      clearInterval(progressInterval);
      setProgress(92);
      setTimeout(() => setProgress(95), 300);
      setTimeout(() => setProgress(97), 600);
      setTimeout(() => setProgress(99), 900);
      setTimeout(() => {
        setProgress(100);
        setTimeout(async () => {
          setIdeas(prev => [savedIdea, ...prev]);
          setPlatformCounts(prev => ({
            ...prev,
            [activePlatform]: (prev[activePlatform] || 0) + 1
          }));
          setTopic('');
          setLoading(false);
          setProgress(0);
        }, 500);
      }, 1200);
    } catch (err) {
      setError(err.message);
      setProgress(0);
      setLoading(false);
    }
  };

  const handleGenerateContent = async (idea) => {
    if (generatingContent) return;
    
    try {
      setGeneratingContent(true);
      setError(null);

      await generateIdeasContent(idea, idea.platform.name, idea.funnel_stage);
      navigate('/dashboard/ideas-content');
    } catch (err) {
      setError('Failed to generate content: ' + err.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleCopy = async (idea) => {
    try {
      await navigator.clipboard.writeText(idea.idea_text);
      setShowCopied(idea.id);
      setTimeout(() => setShowCopied(null), 2000);
    } catch (err) {
      setError('Failed to copy idea');
    }
  };

  const handleUpdate = async (id, newText) => {
    try {
      await updateIdea(id, newText);
      await loadIdeas();
      setEditingIdea(null);
    } catch (err) {
      setError('Failed to update idea');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const ideaId of selectedIdeas) {
        await deleteIdea(ideaId);
      }
      setIdeas(prev => prev.filter(idea => !selectedIdeas.has(idea.id)));
      setPlatformCounts(prev => ({
        ...prev,
        [activePlatform]: Math.max(0, (prev[activePlatform] || 0) - selectedIdeas.size)
      }));
      setSelectedIdeas(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete selected ideas');
    }
  };

  const handleIdeaSelect = (ideaId, isSelected) => {
    const newSelected = new Set(selectedIdeas);
    if (isSelected) {
      newSelected.add(ideaId);
    } else {
      newSelected.delete(ideaId);
    }
    setSelectedIdeas(newSelected);
  };

  // Filter ideas based on selected funnel stage
  const filteredIdeas = ideas.filter(idea => idea.funnel_stage === selectedStage);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Ideas</h1>
          <p className="text-gray-600">Generate targeted content ideas for your marketing funnel</p>
        </div>
        <Link 
          to="/dashboard/ideas-content"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <FiFileText className="w-4 h-4" />
          View Content
        </Link>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {platforms.map((platform) => (
          <PlatformTab
            key={platform.text}
            icon={platform.icon}
            text={platform.text}
            count={platformCounts[platform.text] || 0}
            active={activePlatform === platform.text}
            onClick={() => setActivePlatform(platform.text)}
          />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleGenerateIdeas} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic or Industry
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic or industry..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Funnel Stage
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(FUNNEL_STAGES).map(([stage, label]) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setSelectedStage(stage)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStage === stage
                      ? stage === 'TOFU' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : stage === 'MOFU'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-accent to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Ideas'}
            </button>
          </div>
        </form>
      </div>

      {loading && <IdeasLoadingSpinner progress={progress} />}

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {filteredIdeas.map((idea) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <PlatformIcon platformName={idea.platform.name} />
                <div>
                  <FunnelStageBadge stage={idea.funnel_stage} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleGenerateContent(idea)}
                  className="p-2 hover:bg-gray-50 rounded-lg"
                >
                  <FiFileText className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => setEditingIdea(idea)}
                  className="p-2 hover:bg-gray-50 rounded-lg"
                >
                  <FiEdit2 className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => handleCopy(idea)}
                  className="p-2 hover:bg-gray-50 rounded-lg"
                >
                  <FiCopy className="w-4 h-4 text-gray-400" />
                </button>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIdeas.has(idea.id)}
                    onChange={(e) => handleIdeaSelect(idea.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <motion.div 
                    className="w-4 h-4 border-2 border-red-500 rounded flex items-center justify-center peer-checked:bg-red-500 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: selectedIdeas.has(idea.id) ? 1 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <FiCheck className="w-3 h-3 text-white" />
                    </motion.div>
                  </motion.div>
                </label>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              {idea.idea_text.length > 150 ? (
                <>
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">
                    {idea.idea_text.substring(0, 150)}...
                  </p>
                  <button
                    onClick={() => setEditingIdea(idea)}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Show more
                  </button>
                </>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap mb-2">
                  {idea.idea_text}
                </p>
              )}
            </div>
            
            <AnimatePresence>
              {showCopied === idea.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-2 text-green-500 text-sm flex items-center gap-1"
                >
                  <FiCheck className="w-4 h-4" />
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <FloatingDeleteButton 
        count={selectedIdeas.size}
        onClick={() => setShowDeleteConfirm(true)}
      />

      <AnimatePresence>
        {editingIdea && (
          <QuickEditModal
            content={editingIdea.idea_text}
            onSave={(newText) => handleUpdate(editingIdea.id, newText)}
            onClose={() => setEditingIdea(null)}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleBulkDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            message={`Are you sure you want to delete ${selectedIdeas.size} selected items? This action cannot be undone.`}
          />
        )}

        {loading && <IdeasLoadingSpinner progress={progress} />}
        {generatingContent && <GenerateContentModal />}
      </AnimatePresence>
    </div>
  );
}