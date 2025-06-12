import React, { useState } from 'react';
import { FiEdit2, FiCopy, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import QuickEditModal from '../content/QuickEditModal';
import DeleteConfirmModal from '../content/DeleteConfirmModal';
import PlatformIcon from '../platform/PlatformIcon';

export default function TemplateCard({ 
  template, 
  onUpdate, 
  onDelete,
  isSelected,
  onSelect 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  // Ensure we have valid content
  const content = template?.content_text || '';
  const platformName = template?.platform?.name || 'Unknown';
  const createdAt = template?.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown date';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy template');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(template.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const words = content.split(' ');
  const preview = words.slice(0, 15).join(' ');
  const hasMore = words.length > 15;

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
            <p className="text-sm text-gray-500">Created {createdAt}</p>
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
        {hasMore ? (
          <>
            <p>{preview}...</p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-primary hover:text-primary/80 text-sm mt-2"
            >
              Show more
            </button>
          </>
        ) : (
          <p>{content}</p>
        )}
      </div>

      <AnimatePresence>
        {showCopied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 text-green-500 text-sm"
          >
            Copied to clipboard!
          </motion.div>
        )}

        {isEditing && (
          <QuickEditModal
            content={content}
            onSave={(newContent) => {
              onUpdate(template.id, newContent);
              setIsEditing(false);
            }}
            onClose={() => setIsEditing(false)}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}