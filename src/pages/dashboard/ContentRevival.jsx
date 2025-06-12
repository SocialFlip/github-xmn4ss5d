import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Listbox } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import ContentTypeButton from '../../components/dashboard/ContentTypeButton';
import ImageUploadField from '../../components/content/ImageUploadField';
import RevivalLoadingSpinner from '../../components/content/RevivalLoadingSpinner';
import RevivedContent from '../../components/content/RevivedContent';
import IndustryNewsContent from '../../components/content/IndustryNewsContent';
import DeleteConfirmModal from '../../components/content/DeleteConfirmModal';
import FloatingDeleteButton from '../../components/common/FloatingDeleteButton';
import { contentTypes } from '../../data/contentTypes';
import { getBrandVoiceProfiles } from '../../services/brandVoiceProfilesService';
import { 
  reviveContent, 
  saveRevivedContent,
  updateRevivedContent,
  deleteRevivedContent,
  getRevivedContents 
} from '../../services/contentRevival';

// URL validation regex - updated to be more strict
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export default function ContentRevival() {
  const [activeType, setActiveType] = useState('LinkedIn');
  const [contentType, setContentType] = useState('blog');
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isReviving, setIsReviving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [revivedContents, setRevivedContents] = useState([]);
  const [brandVoices, setBrandVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [selectedContents, setSelectedContents] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const imageUploadRef = useRef(null);

  useEffect(() => {
    loadRevivedContents();
    loadBrandVoices();
  }, [activeType]);

  const loadRevivedContents = async () => {
    try {
      const contents = await getRevivedContents(activeType);
      setRevivedContents(contents);
      setSelectedContents(new Set()); // Clear selections when content is reloaded
    } catch (err) {
      console.error('Error loading revived contents:', err);
      setError('Failed to load existing content');
    }
  };

  const loadBrandVoices = async () => {
    try {
      setLoadingVoices(true);
      const voices = await getBrandVoiceProfiles();
      setBrandVoices(voices);
    } catch (err) {
      console.error('Error loading brand voices:', err);
      setError('Failed to load brand voices');
    } finally {
      setLoadingVoices(false);
    }
  };

  const simulateProgress = useCallback(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        const remainingProgress = 90 - prev;
        const increment = Math.max(0.5, Math.min(2, remainingProgress * 0.05));
        return Math.min(90, prev + increment);
      });
    }, 400);
    return interval;
  }, []);

  const handleRevive = async (e, isEnhanced = false) => {
    e.preventDefault();

    // Clear any existing errors
    setError(null);
    setUrlError('');

    // Validate URL for blog and industry types
    if ((contentType === 'blog' || contentType === 'industry') && !validateUrl(url)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    // Enhanced revival requires brand voice
    if (isEnhanced && !selectedVoice) {
      setError('Please select a brand voice for enhanced revival');
      return;
    }

    // Check if form is valid
    if (!isFormValid()) return;

    try {
      setIsReviving(true);
      const progressInterval = simulateProgress();

      const revivedContent = await reviveContent({
        type: contentType,
        url: contentType === 'blog' || contentType === 'industry' ? url : undefined,
        transcript: contentType === 'video' ? transcript : undefined,
        image: selectedImage,
        platform: activeType,
        isEnhanced,
        brandVoice: selectedVoice
      });
      
      clearInterval(progressInterval);
      
      setProgress(92);
      setTimeout(() => setProgress(95), 300);
      setTimeout(() => setProgress(97), 600);
      setTimeout(() => setProgress(99), 900);
      setTimeout(() => {
        setProgress(100);
        // Short delay before showing the content
        setTimeout(async () => {
          const savedContent = await saveRevivedContent(
            revivedContent,
            activeType,
            contentType,
            url,
            selectedVoice
          );
          setRevivedContents(prev => [{
            id: savedContent.id,
            content: revivedContent,
            platform: activeType,
            timestamp: new Date().toISOString(),
            content_type: contentType,
            brandVoice: selectedVoice
          }, ...prev]);

          setUrl('');
          setTranscript('');
          setSelectedImage(null);
          // Clear the uploaded image
          if (imageUploadRef.current) {
            imageUploadRef.current.clearImage();
          }
          setIsReviving(false);
          setProgress(0);
        }, 500);
      }, 1200);
    } catch (error) {
      setError(error.message);
      setProgress(0);
      setIsReviving(false);
    }
  };

  const handleUpdate = async (id, newContent) => {
    try {
      await updateRevivedContent(id, newContent);
      await loadRevivedContents();
    } catch (err) {
      setError('Failed to update content');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRevivedContent(id);
      await loadRevivedContents();
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
        await deleteRevivedContent(contentId);
      }
      setRevivedContents(prev => prev.filter(content => !selectedContents.has(content.id)));
      setSelectedContents(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete selected content');
    }
  };

  const validateUrl = (urlToValidate) => {
    if (!urlToValidate) return false;
    return URL_REGEX.test(urlToValidate);
  };

  const isFormValid = () => {
    if (isReviving) return false;
    
    switch (contentType) {
      case 'blog':
      case 'industry':
        return validateUrl(url);
      case 'video':
        return transcript.trim().length > 0;
      case 'image':
        return selectedImage !== null;
      default:
        return false;
    }
  };

  const renderInputField = () => {
    switch (contentType) {
      case 'blog':
      case 'industry':
        return (
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError('');
              }}
              onBlur={() => {
                if (url && !validateUrl(url)) {
                  setUrlError('Please enter a valid URL');
                }
              }}
              placeholder={contentType === 'industry' ? "Enter industry news URL..." : "Enter blog post URL..."}
              className={`w-full bg-gray-900 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary ${
                urlError ? 'border-2 border-red-500' : ''
              }`}
              disabled={isReviving}
            />
            {urlError && (
              <p className="mt-2 text-sm text-red-500">{urlError}</p>
            )}
          </div>
        );
      case 'video':
        return (
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Enter YouTube transcript here..."
            className="w-full h-48 bg-gray-900 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            disabled={isReviving}
          />
        );
      case 'image':
        return (
          <ImageUploadField 
            ref={imageUploadRef}
            onImageSelect={setSelectedImage} 
          />
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (contentType === 'industry') {
      return (
        <button 
          onClick={handleRevive}
          disabled={!isFormValid()}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReviving ? 'Reviving...' : 'Content Revival'}
        </button>
      );
    }

    return (
      <>
        <button 
          onClick={handleRevive}
          disabled={!isFormValid()}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReviving ? 'Reviving...' : 'Basic Revival'}
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            handleRevive(e, true);
          }}
          disabled={!isFormValid() || !selectedVoice}
          className="bg-gradient-to-r from-accent to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReviving ? 'Reviving...' : 'Enhanced Revival'}
        </button>
      </>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Revival</h1>
          <p className="text-gray-600">Transform your existing content into engaging social media posts</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {contentTypes.map((type) => {
          const Icon = type.icon;
          return (
            <ContentTypeButton
              key={type.text}
              Icon={Icon}
              text={type.text}
              color={type.color}
              active={activeType === type.text}
              onClick={() => setActiveType(type.text)}
            />
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-grow">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setContentType('blog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  contentType === 'blog'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Blog Post
              </button>
              <button
                onClick={() => setContentType('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  contentType === 'video'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                YT Transcript
              </button>
              <button
                onClick={() => setContentType('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  contentType === 'image'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Image
              </button>
              <button
                onClick={() => setContentType('industry')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  contentType === 'industry'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Industry News
              </button>
            </div>
            {renderInputField()}
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Voice
            </label>
            <Listbox value={selectedVoice} onChange={setSelectedVoice}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm">
                  <span className="block truncate">
                    {loadingVoices 
                      ? 'Loading voices...' 
                      : selectedVoice 
                        ? selectedVoice.name 
                        : 'Select a brand voice'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FiChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {brandVoices.map((voice) => (
                    <Listbox.Option
                      key={voice.id}
                      value={voice}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-primary/5 text-primary' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {voice.name}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <FiCheck className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                  {brandVoices.length === 0 && !loadingVoices && (
                    <div className="py-2 px-4 text-sm text-gray-500">
                      No brand voices found. Create one first.
                    </div>
                  )}
                </Listbox.Options>
              </div>
            </Listbox>
            {!selectedVoice && !loadingVoices && (
              <p className="mt-2 text-sm text-amber-600">
                Select a brand voice to enhance your content
              </p>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-4 flex gap-4">
          {renderActionButtons()}
        </div>
      </div>

      {isReviving && <RevivalLoadingSpinner progress={progress} />}

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {revivedContents.map(content => (
          content.content_type === 'industry' ? (
            <IndustryNewsContent
              key={content.id}
              content={content.content}
              platform={content.platform}
              timestamp={content.timestamp}
              brandVoice={content.brandVoice}
              onUpdate={(newContent) => handleUpdate(content.id, newContent)}
              onDelete={() => handleDelete(content.id)}
              isSelected={selectedContents.has(content.id)}
              onSelect={(isSelected) => handleContentSelect(content.id, isSelected)}
            />
          ) : (
            <RevivedContent
              key={content.id}
              content={content.content}
              platform={content.platform}
              timestamp={content.timestamp}
              brandVoice={content.brandVoice}
              onUpdate={(newContent) => handleUpdate(content.id, newContent)}
              onDelete={() => handleDelete(content.id)}
              isSelected={selectedContents.has(content.id)}
              onSelect={(isSelected) => handleContentSelect(content.id, isSelected)}
            />
          )
        ))}
      </div>

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