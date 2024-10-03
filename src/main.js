import { fetchImages } from './js/pixabay-api';  
import { renderGallery, clearGallery } from './js/render-functions';
import './css/styles.css';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

let currentPage = 1;
const perPage = 15;
const debounceDelay = 300; 
let debounceTimer;

const form = document.querySelector('#search-form');
const input = form.querySelector('input');
const loader = document.querySelector('.loader'); 
const loadMoreBtn = document.querySelector('.load-btn');
const gallery = document.querySelector('.gallery');

export const galleryLightbox = new SimpleLightbox('.gallery a', {
  captions: true,
  captionsData: 'data-caption',
  captionDelay: 250,
});

let query = '';
let isEndOfResultsNotificationShown = false; 
let isLoading = false; 


form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => onSearch(e), debounceDelay);
});

loadMoreBtn.addEventListener('click', onLoadMore);

async function onSearch(e) {
    query = input.value.trim();
  
    if (!query) {
      return showNotification('warning', 'Please enter a search query!');
    }
  
    currentPage = 1;
    clearGallery();
    resetSearchState();
  
    toggleLoader(true);
    loadMoreBtn.style.display = 'none';
  
    await searchImages(query); 
}

async function searchImages(query) {
    if (isLoading) return;
    isLoading = true;
  
    try {
      const data = await fetchImages(query, currentPage, perPage);
      toggleLoader(false); 

      if (data.hits.length === 0) {
        return showNotification('info', 'Sorry, no images were found for your search query.');
      }
  
      renderGallery(data.hits);
      galleryLightbox.refresh();
  
      handleLoadMoreButton(data.totalHits);
      scrollToNextPage();
      input.value = '';
    } catch (error) {
      handleSearchError(error);
    } finally {
      isLoading = false;
    }
}

async function onLoadMore() {
    if (isLoading) return;

    loadMoreBtn.classList.add('loading');
    currentPage += 1; 
    await searchImages(query);
    loadMoreBtn.classList.remove('loading');
}

function handleLoadMoreButton(totalHits) {
    const isMoreResults = totalHits > currentPage * perPage;
    loadMoreBtn.style.display = isMoreResults ? 'block' : 'none';

    if (!isMoreResults && !isEndOfResultsNotificationShown) {
      showNotification('info', "We're sorry, but you've reached the end of search results.");
      isEndOfResultsNotificationShown = true;
    }
}

function handleSearchError(error) {
    toggleLoader(false);
    showNotification('error', 'Something went wrong. Please try again later.');
    console.error(error);
}

function toggleLoader(isLoadingFlag) {
    loader.style.display = isLoadingFlag ? 'flex' : 'none';
}

function showNotification(type, message) {
  iziToast[type]({
    title: type.charAt(0).toUpperCase() + type.slice(1),
    message,
  });
}

function scrollToNextPage() {
    const firstCard = gallery.firstElementChild;
    if (!firstCard) return;

    const { height: cardHeight } = firstCard.getBoundingClientRect();
    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });
}

function resetSearchState() {
    isEndOfResultsNotificationShown = false;
}