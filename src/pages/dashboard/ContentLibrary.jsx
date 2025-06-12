import React, { useState, useEffect } from 'react';
import { FiGrid, FiTwitter, FiLinkedin, FiInstagram, FiLayout, FiBook } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ContentFilter from '../../components/dashboard/ContentFilter';
import ContentCard from '../../components/dashboard/ContentCard';
import DeleteConfirmModal from '../../components/content/DeleteConfirmModal';
import FloatingDeleteButton from '../../components/common/FloatingDeleteButton';
import { getContents, deleteContent } from '../../services/contentStorage';
import { getPlatformConfig } from '../../utils/platformConfig';

const filters = [
  { icon: null, text: 'All Content' },
  { icon: <FiLinkedin className="w-4 h-4" />, text: 'LinkedIn' },
  { icon: <FiTwitter className="w-4 h-4" />, text: 'Twitter' },
  { icon: <FiInstagram className="w-4 h-4" />, text: 'Instagram' },
  { icon: <FiGrid className="w-4 h-4" />, text: 'Carousel' },
  { icon: <FiBook className="w-4 h-4" />, text: 'Story Breakdown' },
  { icon: <FiLayout className="w-4 h-4" />, text: 'Mini-Guide' }
];

export default function ContentLibrary() {
  const [activeFilter, setActiveFilter] = useState('All Content');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContents, setSelectedContents] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContents();
      setContents(data || []);
      setSelectedContents(new Set()); // Clear selections when content is reloaded
    } catch (err) {
      console.error('Error loading contents:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
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
        const content = contents.find(c => c.id === contentId);
        if (content) {
          await deleteContent(contentId, content.source);
        }
      }
      setContents(prev => prev.filter(content => !selectedContents.has(content.id)));
      setSelectedContents(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete selected content');
    }
  };

  const filteredContents = activeFilter === 'All Content'
    ? contents
    : contents.filter(content => {
        const platformName = content.platform?.name;
        if (activeFilter === 'Twitter') {
          return platformName === 'Twitter Post' || platformName === 'Twitter Thread';
        }
        return platformName === activeFilter;
      });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Library</h1>
        <p className="text-gray-600">Manage your generated and revived content</p>
      </div>

      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-4">
          {filters.map((filter, index) => (
            <ContentFilter
              key={index}
              icon={filter.icon}
              text={filter.text}
              active={activeFilter === filter.text}
              onClick={() => setActiveFilter(filter.text)}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading content...</p>
        </div>
      ) : filteredContents.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredContents.map((item) => (
            <ContentCard
              key={item.id}
              id={item.id}
              platform={{
                name: item.platform?.name || 'Unknown',
                icon: getPlatformConfig(item.platform?.name).icon
              }}
              date={item.created_at}
              content={item.content_text}
              source={item.source}
              onDelete={loadContents}
              isSelected={selectedContents.has(item.id)}
              onSelect={(isSelected) => handleContentSelect(item.id, isSelected)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No content found.</p>
        </div>
      )}

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