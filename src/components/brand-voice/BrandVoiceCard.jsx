import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiEdit2, FiTrash2 } from 'react-icons/fi';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditVoiceModal from './EditVoiceModal';
import SaveNotification from '../common/SaveNotification';

export default function BrandVoiceCard({ voice, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const truncateWords = (text, numWords) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= numWords) return text;
    return words.slice(0, numWords).join(' ') + '...';
  };

  const handleSave = async (updatedVoice) => {
    try {
      await onEdit(updatedVoice);
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        setIsEditing(false);
      }, 6000);
    } catch (error) {
      console.error('Error saving voice:', error);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FiUsers className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{voice.name}</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-50 rounded-lg"
          >
            <FiEdit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Tone</h4>
          <p className="text-gray-600 text-sm line-clamp-2">{voice.tone}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Style</h4>
          <p className="text-gray-600 text-sm line-clamp-2">{voice.style}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
          <p className="text-gray-600 text-sm line-clamp-2">{voice.description}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setIsEditing(true)}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Show More
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <EditVoiceModal
            voice={voice}
            onClose={() => setIsEditing(false)}
            onSave={handleSave}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={() => {
              onDelete(voice.id);
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>

      <SaveNotification show={showSaved} />
    </motion.div>
  );
}