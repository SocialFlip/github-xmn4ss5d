import React, { useState } from 'react';
import { FiEdit2, FiCopy, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteContent, updateContent } from '../../services/contentStorage';
import QuickEditModal from '../content/QuickEditModal';
import PlatformIcon from '../platform/PlatformIcon';
import PlatformBadge from '../platform/PlatformBadge';

export default function ContentCard({ 
  id, 
  platform, 
  date, 
  content, 
  source, 
  onDelete,
  isSelected,
  onSelect 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const formattedDate = `Created ${new Date(date).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  })}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy content');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContent(id, source);
      onDelete && onDelete();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete content');
    }
  };

  const handleSave = async (newContent) => {
    try {
      await updateContent(id, newContent, source);
      onDelete && onDelete();
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update content');
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
          <PlatformIcon platformName={platform.name} />
          <div>
            <PlatformBadge platformName={platform.name} />
            <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        {content.length > 150 ? (
          <>
            <p className="whitespace-pre-wrap mb-2">
              {content.substring(0, 150)}...
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
            {content}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <QuickEditModal
            content={content}
            onSave={handleSave}
            onClose={() => setIsEditing(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}