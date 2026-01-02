// SlushSort - Manuscript Triage for Publishing Houses
// ====================================================

// TODO: Update this URL when backend is deployed to Vercel
// Example: 'https://slushsort-backend.vercel.app'
const API_URL = 'http://localhost:8001';

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

  // Populate metadata
  document.getElementById('word-count').textContent = result.wordCount.toLocaleString();
  document.getElementById('page-count').textContent = result.pageCount;
  document.getElementById('genres').textContent = result.genres.join(', ');
  document.getElementById('themes').textContent = result.themes.join(', ');
  document.getElementById('target-audience').textContent = result.targetAudience;
  document.getElementById('comp-titles').textContent = result.compTitles.join(', ');

  // Populate scores
  document.getElementById('overall-score').textContent = result.scores.overall;
  
  const scoresGrid = document.getElementById('scores-grid');
  scoresGrid.innerHTML = '';
  
  const scoreCategories = [
    { key: 'writingQuality', label: 'Writing Quality', desc: 'Prose, dialogue, and technical craft' },
    { key: 'plotStructure', label: 'Plot & Structure', desc: 'Pacing, narrative arc, and coherence' },
    { key: 'characterDevelopment', label: 'Character Development', desc: 'Depth, growth, and relatability' },
    { key: 'marketability', label: 'Marketability', desc: 'Commercial appeal and sales potential' },
    { key: 'originality', label: 'Originality', desc: 'Fresh concepts and unique voice' },
    { key: 'audienceFit', label: 'Audience Fit', desc: 'Alignment with target readership' },
    { key: 'trendAlignment', label: 'Trend Alignment', desc: 'Relevance to current market trends' },
    { key: 'seriesPotential', label: 'Series Potential', desc: 'Opportunity for sequels or franchise' },
  ];
  
  scoreCategories.forEach(cat => {
    const score = result.scores[cat.key];
    const scoreClass = getScoreClass(score);
    
    scoresGrid.innerHTML += `
      <div class="score-card">
        <div class="score-card__header">
          <span class="score-card__label">${cat.label}</span>
          <span class="score-card__value ${scoreClass}">${score}</span>
        </div>
        <div class="score-card__bar">
          <div class="score-card__fill ${scoreClass}" style="width: ${score}%"></div>
        </div>
        <p class="score-card__desc">${cat.desc}</p>
      </div>
    `;
  });

  // Populate recommendation
  document.getElementById('recommendation').textContent = result.recommendation;
  document.getElementById('recommendation-text').innerHTML = formatMarkdown(result.recommendationDetails);
  
  // Populate summary
  document.getElementById('summary-content').innerHTML = formatMarkdown(result.summary);
}

function getScoreClass(score) {
  if (score >= 80) return 'score--high';
  if (score >= 60) return 'score--medium';
  return 'score--low';
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

// Demo mode
function runDemo() {
  const demoResult = {
    wordCount: 87432,
    pageCount: 312,
    genres: ['Literary Fiction', 'Mystery'],
    themes: ['Family secrets', 'Small-town dynamics', 'Grief and healing', 'Identity'],
    targetAudience: 'Adult readers of literary fiction, fans of Celeste Ng and Tana French',
    compTitles: ['Everything I Never Told You', 'The Secret History', 'Big Little Lies'],
    scores: {
      overall: 76,
      writingQuality: 82,
      plotStructure: 74,
      characterDevelopment: 85,
      marketability: 71,
      originality: 68,
      audienceFit: 79,
      trendAlignment: 72,
      seriesPotential: 45,
    },
    recommendation: 'REQUEST FULL MANUSCRIPT',
    recommendationDetails: `This submission shows **strong commercial potential** with excellent character work and prose quality. The literary mystery hybrid is performing well in the current market, particularly with book club audiences.

**Key strengths** that warrant further review:
• Distinctive narrative voice reminiscent of successful literary thrillers
• Well-drawn ensemble cast with authentic small-town dynamics
• Timely themes around family and identity that resonate with current readers

**Considerations for acquisition:**
• Middle section pacing may need editorial attention
• Marketing positioning between literary and commercial fiction requires clear strategy
• Author platform appears limited but manuscript quality could support debut push`,
    summary: `**THE LIGHTHOUSE KEEPER'S DAUGHTER** follows Evelyn March, a journalist who returns to her coastal Maine hometown after seventeen years to investigate the newly-discovered remains found beneath the abandoned lighthouse—remains that may belong to her father, who vanished when she was twelve.

The narrative alternates between Evelyn's present-day investigation and flashbacks to 1987, gradually revealing the web of secrets connecting several founding families. The author demonstrates particular skill in creating atmospheric tension and layered character relationships.

**Comparable positioning:** This sits at the intersection of literary fiction and domestic suspense, similar to recent successes like *The Silent Patient* and *Where the Crawdads Sing*, though with a more literary bent.

**Market context:** Literary mysteries continue to perform strongly, particularly those featuring complex female protagonists and family-centered plots. The coastal New England setting aligns well with the ongoing interest in atmospheric, place-based fiction.`
  };

  showResults(demoResult);
}

// Simple markdown to HTML converter
function formatMarkdown(text) {
  if (!text) return '';
  
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  const paragraphs = html.split(/\n\n+/);
  const processed = [];
  let currentList = null;
  let listType = null;
  
  paragraphs.forEach(p => {
    p = p.trim();
    if (!p) return;
    
    if (p.match(/^[-•]\s/) || p.match(/^[\d]+[\.\)]\s/)) {
      if (listType !== 'ul') {
        if (currentList) processed.push(currentList);
        currentList = { type: 'ul', items: [] };
        listType = 'ul';
      }
      p.split(/\n/).forEach(line => {
        line = line.trim();
        if (line.match(/^[-•]\s/)) {
          currentList.items.push(line.replace(/^[-•]\s/, ''));
        } else if (line.match(/^[\d]+[\.\)]\s/)) {
          currentList.items.push(line.replace(/^[\d]+[\.\)]\s/, ''));
        }
      });
    } else {
      if (currentList) {
        processed.push(currentList);
        currentList = null;
        listType = null;
      }
      processed.push({ type: 'p', content: p.replace(/\n/g, '<br>') });
    }
  });
  
  if (currentList) processed.push(currentList);
  
  html = processed.map(item => {
    if (item.type === 'ul') {
      return '<ul>' + item.items.map(i => `<li>${i}</li>`).join('') + '</ul>';
    }
    return `<p>${item.content}</p>`;
  }).join('');
  
  return html;
}

