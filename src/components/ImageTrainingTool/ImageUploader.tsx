/**
 * Enhanced Image Uploader Component
 * Supports drag-drop, paste, camera capture, and file upload
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { generateImageDescription, uploadImagesForTraining, type ImageWithDescription } from '../../lib/api/imageTrainingApi';
import '../../css/components/ImageTrainingTool/ImageUploader.css';

interface ImageUploaderProps {
  images: ImageWithDescription[];
  onImagesChange: (images: ImageWithDescription[]) => void;
  disabled?: boolean;
  onUploadUrls?: (urls: string[]) => void;
  trainingInProgress?: boolean;
  captionProgress?: Record<number, { status: 'pending' | 'generating' | 'completed' | 'failed'; description?: string; error?: string }>;
}

export default function ImageUploader({
  images,
  onImagesChange,
  disabled = false,
  onUploadUrls,
  trainingInProgress = false,
  captionProgress = {},
}: ImageUploaderProps) {
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [compactView, setCompactView] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageWithDescription[]>(images);
  
  // Keep ref in sync with images prop
  useEffect(() => {
    imagesRef.current = images;
    console.log('[ImageUploader] Images prop updated:', images.map((img, idx) => ({
      index: idx,
      name: img.file.name,
      hasDescription: !!img.description,
      description: img.description?.substring(0, 50),
      descriptionLoading: img.descriptionLoading,
      descriptionError: img.descriptionError,
    })));
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

    onImagesChange([...images, ...newImages]);
  }, [images, onImagesChange]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!disabled) {
      addImages(acceptedFiles);
    }
  }, [disabled, addImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    },
    disabled,
    multiple: true,
  });

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled) return;
      
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
  }, [disabled, addImages]);

  // Handle file input
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(Array.from(files));
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addImages]);

  // Handle camera capture
  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(Array.from(files));
    }
    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, [addImages]);

  // Generate description for a single image
  const generateDescription = useCallback(async (index: number) => {
    // Get latest images from ref
    const currentImages = imagesRef.current;
    const image = currentImages[index];
    
    if (!image || image.descriptionLoading || image.description) {
      console.log(`[ImageUploader] Skipping image ${index + 1} - already loading or has description`);
      return;
    }

    // Update loading state immediately
    const updatedImages = [...currentImages];
    updatedImages[index] = {
      ...image,
      descriptionLoading: true,
      descriptionError: undefined,
    };
    onImagesChange(updatedImages);
    imagesRef.current = updatedImages; // Update ref

    try {
      console.log(`[ImageUploader] Starting description generation for image ${index + 1}:`, image.file.name);
      
      // Use default options for detailed image description
      const response = await generateImageDescription(image.file, {
        caption: true,
        context: 'describe the image styles and colors and contexts',
        question: 'describe this image or images detail manner',
        temperature: 1,
        use_nucleus_sampling: false,
      });
      
      console.log(`[ImageUploader] Description received for image ${index + 1}:`, response);
      console.log(`[ImageUploader] Description text:`, response.description);
      console.log(`[ImageUploader] Description length:`, response.description?.length);
      
      // Get latest images again (in case they changed during async operation)
      const latestImages = [...imagesRef.current];
      const latestImage = latestImages[index];
      
      if (!latestImage) {
        console.error(`[ImageUploader] Image at index ${index} no longer exists`);
        return;
      }

      // Update with description
      latestImages[index] = {
        ...latestImage,
        description: response.description,
        descriptionLoading: false,
        descriptionError: undefined,
      };
      
      console.log(`[ImageUploader] Updated image ${index + 1} with description:`, latestImages[index].description);
      console.log(`[ImageUploader] Full updated image object:`, latestImages[index]);
      console.log(`[ImageUploader] descriptionLoading:`, latestImages[index].descriptionLoading);
      console.log(`[ImageUploader] description exists:`, !!latestImages[index].description);
      
      imagesRef.current = latestImages; // Update ref
      onImagesChange(latestImages);
      
      // Verify update after a short delay
      setTimeout(() => {
        console.log(`[ImageUploader] Verification - images[${index}].description:`, imagesRef.current[index]?.description);
      }, 100);
    } catch (error: any) {
      console.error(`[ImageUploader] Error generating description for image ${index + 1}:`, error);
      console.error(`[ImageUploader] Error details:`, error);
      
      // Get latest images
      const latestImages = [...imagesRef.current];
      const latestImage = latestImages[index];
      
      if (latestImage) {
        latestImages[index] = {
          ...latestImage,
          descriptionLoading: false,
          descriptionError: error.message || 'Failed to generate description',
        };
        
        imagesRef.current = latestImages; // Update ref
        onImagesChange(latestImages);
      }
    }
  }, [onImagesChange]);

  // Generate descriptions for all images
  const generateAllDescriptions = useCallback(async () => {
    setIsGeneratingDescriptions(true);
    try {
      for (let i = 0; i < images.length; i++) {
        if (!images[i].description && !images[i].descriptionLoading) {
          await generateDescription(i);
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      setIsGeneratingDescriptions(false);
    }
  }, [images, generateDescription]);

  // Upload images and get public URLs
  const uploadImages = useCallback(async () => {
    if (images.length === 0) return;

    setIsUploading(true);
    const updatedImages = [...images];

    try {
      // Mark all as uploading
      updatedImages.forEach((img, idx) => {
        updatedImages[idx] = {
          ...img,
          uploadedUrlLoading: true,
          uploadedUrlError: undefined,
        };
      });
      onImagesChange(updatedImages);

      // Upload images
      const response = await uploadImagesForTraining(images.map(img => img.file));
      
      if (response.success && response.images) {
        // Update images with URLs
        response.images.forEach((uploaded, idx) => {
          const imageIndex = images.findIndex(img => img.file.name === uploaded.filename);
          if (imageIndex !== -1) {
            updatedImages[imageIndex] = {
              ...updatedImages[imageIndex],
              uploadedUrl: uploaded.url,
              uploadedUrlLoading: false,
              description: uploaded.description || updatedImages[imageIndex].description,
            };
          }
        });

        onImagesChange(updatedImages);

        // Call callback with URLs
        if (onUploadUrls) {
          const urls = updatedImages
            .map(img => img.uploadedUrl)
            .filter((url): url is string => !!url);
          onUploadUrls(urls);
        }
      }
    } catch (error: any) {
      // Mark all as error
      updatedImages.forEach((img, idx) => {
        updatedImages[idx] = {
          ...img,
          uploadedUrlLoading: false,
          uploadedUrlError: error.message || 'Failed to upload image',
        };
      });
      onImagesChange(updatedImages);
    } finally {
      setIsUploading(false);
    }
  }, [images, onImagesChange, onUploadUrls]);

  // Create dataset zip file
  const createDatasetZip = useCallback(async () => {
    if (images.length === 0) return;

    setIsCreatingZip(true);
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const descriptionsFolder = zip.folder('descriptions');

      if (!imagesFolder || !descriptionsFolder) {
        throw new Error('Failed to create zip folders');
      }

      // Add images and descriptions
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageName = `image_${i + 1}_${image.file.name}`;
        
        // Add image file
        imagesFolder.file(imageName, image.file);

        // Add description file
        const description = image.description || 'No description available';
        const descriptionFileName = `image_${i + 1}_description.txt`;
        descriptionsFolder.file(descriptionFileName, description);
      }

      // Create metadata file
      const metadata = {
        total_images: images.length,
        created_at: new Date().toISOString(),
        images: images.map((img, idx) => ({
          index: idx + 1,
          filename: img.file.name,
          description: img.description || 'No description',
        })),
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      // Download zip file
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `training-dataset-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    } catch (error: any) {
      console.error('Error creating zip:', error);
      alert(`Failed to create zip file: ${error.message}`);
    } finally {
      setIsCreatingZip(false);
    }
  }, [images]);

  // Remove image
  const removeImage = useCallback((index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    // Remove from expanded set
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices for items after the removed one
      const adjustedSet = new Set<number>();
      newSet.forEach(idx => {
        if (idx > index) {
          adjustedSet.add(idx - 1);
        } else {
          adjustedSet.add(idx);
        }
      });
      return adjustedSet;
    });
  }, [images, onImagesChange]);

  // Toggle card expansion
  const toggleCardExpansion = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="image-uploader-container">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`image-uploader-dropzone ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="uploader-content">
          <div className="uploader-icon">📸</div>
          <div className="uploader-text">
            {isDragActive ? (
              <span>Drop images here</span>
            ) : (
              <>
                <span>Drag & drop images here, or</span>
                <span className="uploader-link">click to browse</span>
              </>
            )}
          </div>
          <div className="uploader-actions">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="uploader-button"
              disabled={disabled}
            >
              📁 Upload Files
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="uploader-button"
              disabled={disabled}
            >
              📷 Take Photo
            </button>
            <span className="uploader-hint">or paste from clipboard</span>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="image-grid-container">
          <div className="image-grid-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3>{images.length} Image{images.length !== 1 ? 's' : ''} Selected</h3>
              <button
                type="button"
                onClick={() => setCompactView(!compactView)}
                className="action-button"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {compactView ? '📐 Standard View' : '📦 Compact View'}
              </button>
            </div>
            <div className="image-grid-actions">
              <button
                type="button"
                onClick={generateAllDescriptions}
                disabled={disabled || isGeneratingDescriptions || images.every(img => img.description) || trainingInProgress}
                className="action-button"
              >
                {isGeneratingDescriptions ? 'Generating...' : '📝 Generate All Descriptions'}
              </button>
              <button
                type="button"
                onClick={uploadImages}
                disabled={disabled || isUploading || images.some(img => !img.uploadedUrl && img.uploadedUrlLoading)}
                className="action-button primary"
              >
                {isUploading ? 'Uploading...' : '☁️ Upload & Get URLs'}
              </button>
              <button
                type="button"
                onClick={createDatasetZip}
                disabled={disabled || isCreatingZip}
                className="action-button"
              >
                {isCreatingZip ? 'Creating...' : '📦 Download Dataset ZIP'}
              </button>
            </div>
          </div>

          <div className={`image-grid ${compactView ? 'compact' : ''}`}>
            {images.map((image, index) => {
              const isExpanded = expandedCards.has(index);
              const hasDescription = !!image.description;
              const isLoading = image.descriptionLoading;
              
              return (
                <div 
                  key={index} 
                  className={`image-card ${compactView ? 'compact' : ''} ${isExpanded ? 'expanded' : ''}`}
                  onClick={(e) => {
                    if (!isExpanded && hasDescription) {
                      toggleCardExpansion(index, e);
                    }
                  }}
                >
                  <div className="image-card-header">
                    <span className="image-number">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={(e) => removeImage(index, e)}
                      className="remove-image-button"
                      disabled={disabled}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="image-preview-wrapper">
                    <img src={image.preview} alt={`Image ${index + 1}`} className="image-preview" />
                    
                    {/* Status indicator */}
                    {(() => {
                      const progress = captionProgress[index];
                      if (progress) {
                        if (progress.status === 'completed') {
                          return <div className="image-status-indicator has-description" title="Caption generated"></div>;
                        } else if (progress.status === 'generating') {
                          return <div className="image-status-indicator loading" title="Generating caption"></div>;
                        } else if (progress.status === 'failed') {
                          return <div className="image-status-indicator error" title="Caption generation failed"></div>;
                        }
                      }
                      // Fallback to image state
                      if (hasDescription) {
                        return <div className="image-status-indicator has-description" title="Has description"></div>;
                      }
                      if (isLoading) {
                        return <div className="image-status-indicator loading" title="Generating description"></div>;
                      }
                      if (image.descriptionError) {
                        return <div className="image-status-indicator error" title="Error generating description"></div>;
                      }
                      return null;
                    })()}
                    
                    {image.uploadedUrlLoading && (
                      <div className="image-overlay">
                        <div className="loading-spinner">⏳</div>
                        <span>Uploading...</span>
                      </div>
                    )}
                    {image.uploadedUrl && (
                      <div className="image-badge success">✓</div>
                    )}
                    {image.uploadedUrlError && (
                      <div className="image-badge error">✗</div>
                    )}
                    
                    {/* Expand/collapse toggle */}
                    {hasDescription && (
                      <button
                        type="button"
                        onClick={(e) => toggleCardExpansion(index, e)}
                        className="image-expand-toggle"
                        title={isExpanded ? 'Collapse' : 'Expand to see description'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    )}
                  </div>
                <div className="image-card-content">
                  <div className="image-name" title={image.file.name}>{image.file.name}</div>
                  {!compactView && (
                    <div className="image-size">
                      {(image.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                  
                  {/* Description Section - Only show when expanded */}
                  {isExpanded && (
                    <div className="image-description-section">
                    {image.descriptionLoading ? (
                      <div className="description-loading">Generating description...</div>
                    ) : image.description ? (
                      <div className="description-content">
                        <div className="description-label">Description:</div>
                        <div className="description-text">{image.description}</div>
                      </div>
                    ) : image.descriptionError ? (
                      <div className="description-error">
                        {image.descriptionError}
                        <button
                          type="button"
                          onClick={() => generateDescription(index)}
                          className="retry-button"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => generateDescription(index)}
                        className="generate-description-button"
                        disabled={disabled || trainingInProgress}
                      >
                        📝 Generate Description
                      </button>
                    )}
                    </div>
                  )}

                  {/* Uploaded URL - Only show when expanded */}
                  {isExpanded && image.uploadedUrl && (
                    <div className="image-url-section">
                      <div className="url-label">URL:</div>
                      <div className="url-text" title={image.uploadedUrl}>
                        {image.uploadedUrl.length > 50
                          ? `${image.uploadedUrl.substring(0, 50)}...`
                          : image.uploadedUrl}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(image.uploadedUrl!)}
                        className="copy-button"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

