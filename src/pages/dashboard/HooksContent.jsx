import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import HookTypeButton from '../../components/hooks/HookTypeButton';
import HooksContentCard from '../../components/hooks/HooksContentCard';
import EmptyState from '../../components/hooks/EmptyState';
import DeleteConfirmModal from '../../components/content/DeleteConfirmModal';
import FloatingDeleteButton from '../../components/common/FloatingDeleteButton';
import { HOOK_TYPES } from '../../data/hookData';
import HookTypeIcon from '../../components/hooks/HookTypeIcon';
import { getHooksContent, updateHooksContent, deleteHooksContent } from '../../services/hooksContentService';

export default function HooksContent() {
  const [activeType, setActiveType] = useState(HOOK_TYPES.ALL);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentCounts, setContentCounts] = useState({});
  const [selectedContents, setSelectedContents] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadContent();
  }, [activeType]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHooksContent(activeType);
      
      // Calculate counts for each category
      const counts = {};
      Object.values(HOOK_TYPES).forEach(type => {
        counts[type] = type === HOOK_TYPES.ALL 
          ? data.length 
          : data.filter(item => item.hook_type === type).length;
      });
      
      setContentCounts(counts);
      setContent(data);
      setSelectedContents(new Set()); // Clear selections when content is reloaded
    } catch (err) {
      console.error('Error loading hooks content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, newContent) => {
    try {
      await updateHooksContent(id, newContent);
      await loadContent();
    } catch (err) {
      setError('Failed to update content');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHooksContent(id);
      await loadContent();
    } catch (err) {
      setError('Failed to delete content');
    }
  };

  const handleContentSelect = (contentId, isSelected) => {
    const newSelected = new Set(selectedContents);
    if (isSelected) {
      newSelected.add(contentId);
    } else {
      newSelected.delete(contentId);
    }
    setSelectedContents(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      for (const contentId of selectedContents) {
        await deleteHooksContent(contentId);
      }
      await loadContent();
      setSelectedContents(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete selected content');
    }
  };

  return (
    <div className="p-8">
      <Link 
        to="/dashboard/hooks" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Hooks Library
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hooks Content</h1>
        <p className="text-gray-600">Manage your generated hooks content</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-8">
        {Object.values(HOOK_TYPES).map((type) => (
          <HookTypeButton
            key={type}
            icon={<HookTypeIcon type={type} />}
            text={type}
            count={contentCounts[type] || 0}
            active={activeType === type}
            onClick={() => setActiveType(type)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center h-64"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </motion.div>
        ) : content.length > 0 ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {content.map(item => (
              <HooksContentCard
                key={item.id}
                content={item}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                isSelected={selectedContents.has(item.id)}
                onSelect={(isSelected) => handleContentSelect(item.id, isSelected)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingDeleteButton 
        count={selectedContents.size}
        onClick={() => setShowDeleteConfirm(true)}
      />

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleBulkDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            message={`Are you sure you want to delete ${selectedContents.size} selected items? This action cannot be undone.`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}