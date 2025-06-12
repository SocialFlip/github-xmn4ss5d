import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';

export default function FloatingDeleteButton({ count, onClick }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClick}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        >
          <FiTrash2 className="w-4 h-4" />
          <span>Delete Selected ({count})</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}