// ratemybook - Manuscript Analysis Tool
// =====================================

// TODO: Update this URL when backend is deployed to Vercel
// Example: 'https://your-backend.vercel.app'
const API_URL = 'http://localhost:8000';

// State
let isUploading = false;
let currentResult = null;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');
const loadingSection = document.getElementById('loading-section');
const errorSection = document.getElementById('error-section');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const errorMessage = document.getElementById('error-message');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupDropzone();
  setupFileInput();
}

// Dropzone handlers
function setupDropzone() {
  dropzone.addEventListener('dragenter', handleDragIn);
  dropzone.addEventListener('dragleave', handleDragOut);
  dropzone.addEventListener('dragover', handleDragOver);
  dropzone.addEventListener('drop', handleDrop);
  dropzone.addEventListener('click', () => fileInput.click());
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDragIn(e) {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('dropzone--active');
}

function handleDragOut(e) {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dropzone--active');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dropzone--active');

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
}

// File input handler
function setupFileInput() {
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  });
}

// File validation
function validateFile(file) {
  const validTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  const validExtensions = ['.txt', '.pdf', '.doc', '.docx'];
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return hasValidType || hasValidExtension;
}

// Process uploaded file
async function processFile(file) {
  if (!validateFile(file)) {
    showError('Please upload a valid file (TXT, PDF, or DOC)');
    return;
  }

  showLoading();

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    currentResult = result;
    showResults(result);
  } catch (err) {
    showError(err.message || 'An error occurred during upload');
    console.error('Upload error:', err);
  }
}

// UI State Management
function showLoading() {
  uploadSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
}

function showResults(result) {
  loadingSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  uploadSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');

  // Populate results
  document.getElementById('score-value').textContent = result.score;
  document.getElementById('strengths-content').innerHTML = formatMarkdown(result.strengths);
  document.getElementById('weaknesses-content').innerHTML = formatMarkdown(result.weaknesses);
  document.getElementById('nextsteps-content').innerHTML = formatMarkdown(result.next_steps);
}

function showError(message) {
  loadingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  errorSection.classList.remove('hidden');
  errorMessage.textContent = message;
}

function resetUpload() {
  currentResult = null;
  fileInput.value = '';
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
}

// Simple markdown to HTML converter
function formatMarkdown(text) {
  if (!text) return '';
  
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Convert markdown
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Line breaks to paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Check if it's a list item
      if (p.match(/^[-•]\s/)) {
        const items = p.split(/\n/).map(item => 
          `<li>${item.replace(/^[-•]\s/, '')}</li>`
        ).join('');
        return `<ul>${items}</ul>`;
      }
      // Check if it's a numbered list
      if (p.match(/^\d+\.\s/)) {
        const items = p.split(/\n/).map(item => 
          `<li>${item.replace(/^\d+\.\s/, '')}</li>`
        ).join('');
        return `<ol>${items}</ol>`;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
  
  return html;
}

