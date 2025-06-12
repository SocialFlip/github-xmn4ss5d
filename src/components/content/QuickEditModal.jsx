import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';
import SaveNotification from '../common/SaveNotification';

export default function QuickEditModal({ content, onSave, onClose, readOnly = false }) {
  const [editedContent, setEditedContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
      const resizeObserver = new ResizeObserver(adjustTextareaHeight);
      resizeObserver.observe(textareaRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [editedContent, isExpanded]);

  const adjustTextareaHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    
    const viewportHeight = window.innerHeight * 0.8;
    const headerHeight = 76;
    const footerHeight = readOnly ? 0 : 88;
    const contentPadding = 48;
    
    const maxHeight = viewportHeight - headerHeight - footerHeight - contentPadding;
    const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
    textareaRef.current.style.height = `${newHeight}px`;
  };

  const handleSave = () => {
    if (readOnly) return;
    onSave(editedContent);
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      onClose();
    }, 6000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          width: isExpanded ? '90%' : '100%',
          maxWidth: isExpanded ? '90vw' : '42rem',
          height: isExpanded ? '90vh' : 'auto',
          maxHeight: '90vh'
        }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="bg-white rounded-lg w-full flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{readOnly ? 'View Content' : 'Edit Content'}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-hidden">
          <div className={`h-full transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => !readOnly && setEditedContent(e.target.value)}
              className={`w-full p-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all duration-300 rounded-lg border ${
                readOnly ? 'bg-gray-50 cursor-default' : 'bg-white'
              }`}
              readOnly={readOnly}
            />
          </div>
        </div>

        {!readOnly && (
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white rounded-lg hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <SaveNotification show={showSaved} />
    </div>
  );
}