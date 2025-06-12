import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiCopy, FiCheck } from 'react-icons/fi';
import QuickEditModal from './QuickEditModal';
import ContentPreview from './ContentPreview';
import PlatformIcon from '../platform/PlatformIcon';

export default function GeneratedContent({ 
  content: initialContent, 
  onUpdate, 
  onDelete,
  isSelected,
  onSelect 
}) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState(null);

  // Ensure we have valid content
  const contentText = content?.content_text || '';
  const platformName = content?.platform?.name || 'Unknown';
  const createdAt = content?.created_at ? new Date(content.created_at).toLocaleDateString() : 'Unknown date';
  const brandVoice = content?.brand_voice;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy content');
    }
  };

  const handleSave = async (newContent) => {
    try {
      setError(null);
      if (!content.id) {
        throw new Error('Content ID is required');
      }
      
      const updatedContent = await onUpdate(content.id, newContent);
      setContent(prev => ({ ...prev, content_text: updatedContent.content_text }));
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save content');
      console.error('Error saving content:', err);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PlatformIcon platformName={platformName} />
          <div>
            <h3 className="font-semibold text-gray-900">{platformName}</h3>
            <p className="text-sm text-gray-500">
              Generated {new Date(createdAt).toLocaleString()}
            </p>
            {brandVoice && (
              <p className="text-sm text-primary mt-1">
                Using {brandVoice.name} voice
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showSaved && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-green-500 text-sm flex items-center gap-1"
            >
              <FiCheck className="w-4 h-4" />
              Saved!
            </motion.span>
          )}
          {showCopied && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-green-500 text-sm flex items-center gap-1"
            >
              <FiCheck className="w-4 h-4" />
              Copied!
            </motion.span>
          )}
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-50 rounded-lg"
          >
            <FiEdit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-gray-50 rounded-lg"
          >
            <FiCopy className="w-4 h-4 text-gray-400" />
          </button>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="sr-only peer"
            />
            <motion.div 
              className="w-4 h-4 border-2 border-red-500 rounded flex items-center justify-center peer-checked:bg-red-500 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <FiCheck className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
          </label>
        </div>
      </div>
      
      <div className="text-gray-600">
        {contentText.length > 150 ? (
          <>
            <p className="whitespace-pre-wrap mb-2">
              {contentText.substring(0, 150)}...
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Show more
            </button>
          </>
        ) : (
          <p className="whitespace-pre-wrap mb-2">
            {contentText}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <QuickEditModal
            content={contentText}
            onSave={handleSave}
            onClose={() => setIsEditing(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}