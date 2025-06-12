import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiEdit2, FiCheck } from 'react-icons/fi';
import QuickEditModal from './QuickEditModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import PlatformIcon from '../platform/PlatformIcon';

export default function IndustryNewsContent({ 
  content,
  platform,
  timestamp,
  brandVoice,
  onDelete,
  onUpdate,
  isSelected,
  onSelect 
}) {
  const [showCopied, setShowCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy content');
    }
  };

  const handleEdit = async (newContent) => {
    try {
      await onUpdate(newContent);
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
          <PlatformIcon platformName={platform} />
          <div>
            <h3 className="font-semibold text-gray-900">{platform}</h3>
            <p className="text-sm text-gray-500">
              Revived {new Date(timestamp).toLocaleString()}
            </p>
            {brandVoice && (
              <p className="text-sm text-primary mt-1">
                Using {brandVoice.name} voice
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
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
            onSave={handleEdit}
            onClose={() => setIsEditing(false)}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={() => {
              onDelete();
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}