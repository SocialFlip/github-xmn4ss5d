import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

export default function SaveNotification({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            duration: 0.6
          }}
          className="fixed bottom-8 left-8 z-[9999] bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
          >
            <FiCheck className="w-6 h-6" />
          </motion.div>
          <span className="font-medium text-lg">Changes saved successfully</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}