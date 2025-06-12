import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiCopy, FiFileText, FiCheck } from 'react-icons/fi';
import QuickEditModal from '../content/QuickEditModal';
import DeleteConfirmModal from '../content/DeleteConfirmModal';
import HookContentModal from '../content/HookContentModal';
import HookTypeIcon from './HookTypeIcon';

export default function HookCard({ 
  hook, 
  onUpdate, 
  onDelete,
  isSelected,
  onSelect 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [error, setError] = useState(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy hook');
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
          <div className="bg-gray-100 p-2 rounded-lg">
            <HookTypeIcon type={hook.type} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{hook.type}</h3>
            <p className="text-sm text-gray-500">
              Created {new Date(hook.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowContentModal(true)}
            className="p-2 hover:bg-gray-50 rounded-lg"
            title="Generate content from hook"
          >
            <FiFileText className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-gray-50 rounded-lg"
            title="Copy hook"
          >
            <FiCopy className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-50 rounded-lg"
            title="Edit hook"
          >
            <FiEdit2 className="w-4 h-4 text-gray-400" />
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
              <FiCheck className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
            </motion.div>
          </label>
        </div>
      </div>
      
      <div className="text-gray-600">
        {hook.content.length > 150 ? (
          <>
            <p className="whitespace-pre-wrap mb-2">
              {hook.content.substring(0, 150)}...
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
            {hook.content}
          </p>
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
            content={hook.content}
            onSave={(newContent) => {
              onUpdate(hook.id, newContent);
              setIsEditing(false);
            }}
            onClose={() => setIsEditing(false)}
          />
        )}

        {showContentModal && (
          <HookContentModal
            content={hook.content}
            hookType={hook.type}
            onClose={() => setShowContentModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}