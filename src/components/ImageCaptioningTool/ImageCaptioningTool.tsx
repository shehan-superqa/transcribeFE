import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { generateImageDescription, type ImageWithDescription } from '../../lib/api/imageTrainingApi';
import './ImageCaptioningTool.css';

interface CaptioningSession {
  id: string;
  timestamp: number;
  imageCount: number;
  captionedCount: number;
  images: Array<{
    fileName: string;
    caption: string;
    fileData: string; // base64 data URL
  }>;
}

const styles = {
  container: {
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    color: '#f8fafc',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#cbd5e1',
  },
  infoBox: {
    padding: '0.75rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '0.75rem',
    fontSize: '0.85rem',
    color: '#93c5fd',
    marginBottom: '1rem',
  },
  dropzone: {
    border: '2px dashed rgba(99, 102, 241, 0.4)',
    borderRadius: '0.75rem',
    padding: '2rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(99, 102, 241, 0.05)',
  },
  dropzoneActive: {
    borderColor: 'rgba(99, 102, 241, 0.8)',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  dropzoneText: {
    fontSize: '1rem',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  },
  button: {
    background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
    marginTop: '1rem',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  imagesTable: {
    width: '100%',
    marginTop: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 2fr 120px',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 2fr 120px',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    transition: 'background 0.2s ease',
  },
  tableRowHover: {
    background: 'rgba(255, 255, 255, 0.03)',
  },
  thumbnail: {
    width: '60px',
    height: '60px',
    objectFit: 'cover' as const,
    borderRadius: '0.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  fileName: {
    fontSize: '0.85rem',
    color: '#f8fafc',
    wordBreak: 'break-word' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  captionPreview: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    maxHeight: '2.5rem',
  },
  rowActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  smallButton: {
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#a5b4fc',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  expandedRow: {
    gridColumn: '1 / -1',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  expandedImage: {
    maxWidth: '300px',
    maxHeight: '300px',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  },
  expandedCaption: {
    fontSize: '0.9rem',
    color: '#f8fafc',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
  },
  searchContainer: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.9rem',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    marginTop: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.75rem',
  },
  paginationInfo: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  paginationButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  paginationButton: {
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#a5b4fc',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  imageName: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
    wordBreak: 'break-word' as const,
  },
  captionContainer: {
    marginTop: '0.75rem',
  },
  captionLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginBottom: '0.25rem',
  },
  captionText: {
    fontSize: '0.9rem',
    color: '#f8fafc',
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minHeight: '60px',
    wordBreak: 'break-word' as const,
  },
  loadingText: {
    fontSize: '0.85rem',
    color: '#60a5fa',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: '0.85rem',
    color: '#fca5a5',
  },
  actionButton: {
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#a5b4fc',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginTop: '0.5rem',
    width: '100%',
  },
  removeButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginTop: '0.5rem',
    width: '100%',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    marginTop: '1rem',
  },
  progressText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  downloadButton: {
    background: 'linear-gradient(90deg, #10b981, #059669)',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    marginTop: '0.5rem',
  },
  downloadButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

const STORAGE_KEY = 'image_captioning_history';

const ITEMS_PER_PAGE = 50;

export default function ImageCaptioningTool() {
  const [images, setImages] = useState<ImageWithDescription[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const imagesRef = useRef<ImageWithDescription[]>(images);

  // Keep ref in sync with images
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);


  // Convert File to base64 preview
  const fileToPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Add images to the list
  const addImages = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newImages: ImageWithDescription[] = await Promise.all(
      imageFiles.map(async (file) => ({
        file,
        preview: await fileToPreview(file),
        descriptionLoading: false,
      }))
    );

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    addImages(acceptedFiles);
  }, [addImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    },
    multiple: true,
  });

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await addImages(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addImages]);

  // Generate description for a single image
  const generateDescription = useCallback(async (index: number) => {
    const currentImages = imagesRef.current;
    const image = currentImages[index];

    if (!image || image.descriptionLoading || image.description) {
      return;
    }

    // Update loading state
    const updatedImages = [...currentImages];
    updatedImages[index] = {
      ...image,
      descriptionLoading: true,
      descriptionError: undefined,
    };
    setImages(updatedImages);
    imagesRef.current = updatedImages;

    try {
      const response = await generateImageDescription(image.file, {
        caption: true,
        context: 'describe the image styles and colors and contexts',
        question: 'describe this image or images detail manner',
        temperature: 1,
        use_nucleus_sampling: false,
      });

      const latestImages = [...imagesRef.current];
      const latestImage = latestImages[index];

      if (!latestImage) {
        return;
      }

      latestImages[index] = {
        ...latestImage,
        description: response.description,
        descriptionLoading: false,
        descriptionError: undefined,
      };

      imagesRef.current = latestImages;
      setImages(latestImages);
    } catch (error: any) {
      const latestImages = [...imagesRef.current];
      const latestImage = latestImages[index];

      if (latestImage) {
        latestImages[index] = {
          ...latestImage,
          descriptionLoading: false,
          descriptionError: error.message || 'Failed to generate description',
        };

        imagesRef.current = latestImages;
        setImages(latestImages);
      }
    }
  }, []);

  // Generate descriptions for all images
  const generateAllDescriptions = useCallback(async () => {
    setIsGeneratingAll(true);
    try {
      for (let i = 0; i < images.length; i++) {
        if (!images[i].description && !images[i].descriptionLoading) {
          await generateDescription(i);
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      setIsGeneratingAll(false);
    }
  }, [images, generateDescription]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Copy caption to clipboard
  const copyCaption = useCallback((caption: string) => {
    navigator.clipboard.writeText(caption);
  }, []);

  // Convert File to base64 data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Save session to history
  const saveSessionToHistory = useCallback(async (captionedImages: ImageWithDescription[]) => {
    try {
      const session: CaptioningSession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        imageCount: captionedImages.length,
        captionedCount: captionedImages.length,
        images: await Promise.all(
          captionedImages.map(async (img) => ({
            fileName: img.file.name,
            caption: img.description || '',
            fileData: img.preview, // Already a data URL from preview
          }))
        ),
      };

      // Load existing history
      const existingHistory: CaptioningSession[] = (() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            return JSON.parse(stored) as CaptioningSession[];
          }
        } catch (error) {
          console.error('Error loading history:', error);
        }
        return [];
      })();
      
      const updatedHistory = [session, ...existingHistory].slice(0, 50); // Keep last 50 sessions
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      
      // Dispatch custom event to notify history component
      window.dispatchEvent(new Event('captioningHistoryUpdated'));
    } catch (error) {
      console.error('Error saving session to history:', error);
    }
  }, []);

  // Create ZIP file with images and caption text files
  const createZip = useCallback(async () => {
    const captionedImages = images.filter(img => img.description);
    
    if (captionedImages.length === 0) {
      alert('No captioned images to export. Please generate captions first.');
      return;
    }

    setIsCreatingZip(true);
    
    try {
      const zip = new JSZip();

      // Add each image and its corresponding caption text file
      for (const image of captionedImages) {
        // Get the base name without extension
        const fileName = image.file.name;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        
        // Add the image file
        zip.file(fileName, image.file);
        
        // Add the caption text file with the same base name
        if (image.description) {
          const txtFileName = `${baseName}.txt`;
          zip.file(txtFileName, image.description);
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-captions-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Save to history
      await saveSessionToHistory(captionedImages);
      
      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingZip(false);
    }
  }, [images, saveSessionToHistory]);



  // Filter images by search query
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) {
      return images;
    }
    const query = searchQuery.toLowerCase();
    return images.filter(img => 
      img.file.name.toLowerCase().includes(query) ||
      img.description?.toLowerCase().includes(query)
    );
  }, [images, searchQuery]);

  // Paginate images
  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredImages, currentPage]);

  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const toggleRowExpansion = useCallback((index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const imagesNeedingCaption = images.filter(img => !img.description && !img.descriptionLoading).length;
  const imagesWithCaption = images.filter(img => img.description).length;
  const canCreateZip = imagesWithCaption > 0 && !isCreatingZip;

  return (
    <div style={styles.container}>

      <div
        {...getRootProps()}
        style={{
          ...styles.dropzone,
          ...(isDragActive ? styles.dropzoneActive : {}),
        }}
      >
        <input {...getInputProps()} />
        <p style={styles.dropzoneText}>
          {isDragActive
            ? 'Drop images here...'
            : 'Drag & drop images here, or click to select files'}
        </p>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          You can also paste images from your clipboard
        </p>
      </div>

      {images.length > 0 && (
        <>
          <div style={styles.progressContainer}>
            <div style={styles.progressText}>
              Total images: {images.length} | 
              Captioned: {imagesWithCaption} | 
              Pending: {imagesNeedingCaption}
            </div>
            <button
              onClick={generateAllDescriptions}
              disabled={isGeneratingAll || imagesNeedingCaption === 0}
              style={{
                ...styles.button,
                ...(isGeneratingAll || imagesNeedingCaption === 0 ? styles.buttonDisabled : {}),
              }}
            >
              {isGeneratingAll
                ? `Generating captions... (${imagesWithCaption}/${images.length})`
                : `Generate All Captions (${imagesNeedingCaption} remaining)`}
            </button>
            <button
              onClick={createZip}
              disabled={!canCreateZip}
              style={{
                ...styles.downloadButton,
                ...(!canCreateZip ? styles.downloadButtonDisabled : {}),
              }}
            >
              {isCreatingZip
                ? 'Creating ZIP...'
                : `📥 Download ZIP (${imagesWithCaption} captioned image${imagesWithCaption !== 1 ? 's' : ''})`}
            </button>
          </div>

          {/* Search Bar */}
          {images.length > 0 && (
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by filename or caption..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <div style={styles.progressText}>
                Showing {paginatedImages.length} of {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
                {searchQuery && ` (filtered from ${images.length} total)`}
              </div>
            </div>
          )}

          {/* Images Table */}
          {images.length > 0 && (
            <>
              <div style={styles.imagesTable}>
                <div style={styles.tableHeader}>
                  <div>Thumbnail</div>
                  <div>Filename</div>
                  <div>Caption</div>
                  <div>Actions</div>
                </div>
                {paginatedImages.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No images found matching your search.
                  </div>
                ) : (
                  paginatedImages.map((image, localIndex) => {
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const filteredIndex = startIndex + localIndex;
                    const globalIndex = images.findIndex(img => img === image);
                    const isExpanded = expandedRows.has(filteredIndex);
                    return (
                      <div key={`${globalIndex}-${localIndex}`}>
                        <div 
                          style={{
                            ...styles.tableRow,
                            ...(isExpanded ? {} : { cursor: 'pointer' }),
                          }}
                          onClick={() => !isExpanded && toggleRowExpansion(filteredIndex)}
                          onMouseEnter={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <img
                            src={image.preview}
                            alt={image.file.name}
                            style={styles.thumbnail}
                          />
                          <div style={styles.fileName}>{image.file.name}</div>
                          <div style={styles.captionPreview}>
                            {image.descriptionLoading ? (
                              <span style={styles.loadingText}>Generating...</span>
                            ) : image.descriptionError ? (
                              <span style={styles.errorText}>Error: {image.descriptionError}</span>
                            ) : image.description ? (
                              image.description
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No caption</span>
                            )}
                          </div>
                          <div style={styles.rowActions}>
                            {image.descriptionLoading ? (
                              <span style={styles.loadingText}>...</span>
                            ) : image.descriptionError ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateDescription(globalIndex);
                                }}
                                style={styles.smallButton}
                              >
                                Retry
                              </button>
                            ) : image.description ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCaption(image.description!);
                                  }}
                                  style={styles.smallButton}
                                >
                                  Copy
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpansion(filteredIndex);
                                  }}
                                  style={styles.smallButton}
                                >
                                  {isExpanded ? 'Hide' : 'View'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateDescription(globalIndex);
                                }}
                                style={styles.smallButton}
                              >
                                Generate
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(globalIndex);
                              }}
                              style={{
                                ...styles.smallButton,
                                background: 'rgba(239, 68, 68, 0.2)',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                color: '#fca5a5',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={styles.expandedRow}>
                            <img
                              src={image.preview}
                              alt={image.file.name}
                              style={styles.expandedImage}
                            />
                            <div style={styles.captionLabel}>Full Caption:</div>
                            {image.descriptionLoading ? (
                              <div style={styles.loadingText}>Generating caption...</div>
                            ) : image.descriptionError ? (
                              <div style={styles.errorText}>Error: {image.descriptionError}</div>
                            ) : image.description ? (
                              <div style={styles.expandedCaption}>{image.description}</div>
                            ) : (
                              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No caption available</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.paginationContainer}>
                  <div style={styles.paginationInfo}>
                    Page {currentPage} of {totalPages} ({filteredImages.length} total)
                  </div>
                  <div style={styles.paginationButtons}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                      }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

