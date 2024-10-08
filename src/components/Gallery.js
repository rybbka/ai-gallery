import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './Gallery.module.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Gallery() {
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Updated function to handle the data structure and calculate totalPages if needed
  const updateGalleryState = useCallback((data) => {
    if (data.images && Array.isArray(data.images.rows)) {
      setImages(data.images.rows);
      setCurrentPage(data.currentPage);

      // Calculate total pages if not provided or if it's 0
      const calculatedTotalPages = data.totalPages > 0
        ? data.totalPages
        : Math.ceil(data.images.rowCount / 20); // Assuming 20 items per page

      setTotalPages(calculatedTotalPages);

      console.log('Updated state:', {
        imagesCount: data.images.rows.length,
        currentPage: data.currentPage,
        totalPages: calculatedTotalPages
      });
    } else {
      console.error('Invalid data structure received:', data);
      setError('Received invalid data from server');
      setImages([]);
    }
  }, []);

  const handleFetchError = useCallback((error) => {
    console.error('Error fetching gallery:', error);
    setError('Failed to load images. Please try again later.');
  }, []);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fullUrl = `${API_URL}/gallery?page=${currentPage}`;
      console.log('Fetching from:', fullUrl);
      const response = await axios.get(fullUrl, { withCredentials: true });
      console.log('Response:', response.data);
      updateGalleryState(response.data);
    } catch (error) {
      console.error('Error details:', error.response ? error.response.data : error.message);
      console.error('Full error object:', error);
      handleFetchError(error);
    }
    setIsLoading(false);
  }, [currentPage, updateGalleryState, handleFetchError]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleRefresh = () => {
    fetchImages();
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className={styles.galleryContainer}>
      <h1 className={styles.title}>AI Generated Images Gallery</h1>
      <button onClick={handleRefresh} className={styles.refreshButton}>Refresh Gallery</button>
      {isLoading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
      {images.length > 0 ? (
        <ImageGrid images={images} />
      ) : (
        <p>No images available</p>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />
    </div>
  );
}

// ImageGrid component to display a grid of images
function ImageGrid({ images }) {
  // Check if images is a valid array
  if (!Array.isArray(images)) {
    console.error('ImageGrid received non-array images:', images);
    return <p>Error: Invalid image data</p>; // Return error message if images is not an array
  }

  // Render the grid of images
  return (
    <div className={styles.imageGrid}>
      {images.map((image) => (
        <ImageItem key={image.id} image={image} /> // Render an ImageItem for each image
      ))}
    </div>
  );
}

// ImageItem component to display a single image
function ImageItem({ image }) {
  // Function to safely parse the username
  const parseUsername = (usernameString) => {
    if (typeof usernameString !== 'string') {
      return 'Unknown User';
    }

    // Remove any surrounding quotes or curly braces
    const cleanedString = usernameString.replace(/^["'{]+|[}"']+$/g, '');

    // If the cleaned string is empty, return 'Unknown User'
    if (!cleanedString) {
      return 'Unknown User';
    }

    return cleanedString;
  };

  // Use the parseUsername function to get the username
  const username = parseUsername(image.username);

  return (
    <div className={styles.imageItem}>
      <img
        src={`${API_URL}${image.image_path}`}
        alt={image.prompt}
        className={styles.image}
      />
      <p className={styles.caption}>Generated for: {username}</p>
    </div>
  );
}

// Pagination component for navigating between pages
function Pagination({ currentPage, totalPages, isLoading, onPrevious, onNext }) {
  return (
    <div className={styles.pagination}>
      <button
        onClick={onPrevious} // Call onPrevious function when clicked
        disabled={currentPage === 1 || isLoading} // Disable if on first page or loading
        className={styles.paginationButton}
      >
        Previous
      </button>
      <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
      <button
        onClick={onNext} // Call onNext function when clicked
        disabled={currentPage === totalPages || isLoading} // Disable if on last page or loading
        className={styles.paginationButton}
      >
        Next
      </button>
    </div>
  );
}

export default Gallery; // Export the Gallery component as the default export
