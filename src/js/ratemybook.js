// ratemybook - Manuscript Analysis Tool
// =====================================

const API_URL = 'https://portfolio-backend-8mav.onrender.com/ratemybook';

// State
let isUploading = false;
let currentResult = null;

// DOM Elements (initialized on DOMContentLoaded)
let uploadSection, resultsSection, loadingSection, errorSection, dropzone, fileInput, errorMessage;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  // Get DOM elements after page loads
  uploadSection = document.getElementById('upload-section');
  resultsSection = document.getElementById('results-section');
  loadingSection = document.getElementById('loading-section');
  errorSection = document.getElementById('error-section');
  dropzone = document.getElementById('dropzone');
  fileInput = document.getElementById('file-input');
  errorMessage = document.getElementById('error-message');
  
  setupDropzone();
  setupFileInput();
}

// Dropzone handlers
function setupDropzone() {
  dropzone.addEventListener('dragenter', handleDragIn);
  dropzone.addEventListener('dragleave', handleDragOut);
  dropzone.addEventListener('dragover', handleDragOver);
  dropzone.addEventListener('drop', handleDrop);
  // Note: File input already covers dropzone, so no click handler needed
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

// Demo mode - shows example results without backend
function runDemo() {
  const demoResult = {
    score: 72,
    strengths: `**Evelyn's narrative voice is immediately compelling.** Her dry wit in the opening chapter—"The lighthouse had been dark for seventeen years, which was approximately how long I'd been avoiding my mother's phone calls"—establishes both character and tone effectively. This voice remains consistent throughout.

**The coastal Maine setting comes alive through sensory details.** The descriptions of fog rolling in "like a slow exhale," the smell of salt and rotting seaweed, and the constant cry of gulls create an atmospheric backdrop that mirrors Evelyn's emotional state. Chapter 4's storm sequence is particularly visceral.

**The central mystery is well-constructed.** The revelation about Evelyn's father's disappearance unfolds at a measured pace, with each clue building naturally on the last. The red herring involving the harbormaster was especially effective—most readers won't see the actual twist coming.

**Dialogue between Evelyn and her estranged sister Margot crackles with tension.** Their conversations reveal years of resentment without resorting to exposition. The kitchen confrontation in Chapter 9 is a standout scene.`,
    weaknesses: `**The pacing sags considerably in Chapters 8-12.** After the strong opening act, Evelyn's investigation stalls while she processes her feelings about returning home. Consider cutting the two flashback scenes to her college years—they don't add information we don't already have.

**Margot needs more dimension.** Currently she functions primarily as an obstacle to Evelyn. We're told she stayed behind to care for their mother, but we never see her perspective on this sacrifice. Even one scene from her point of view could transform her from antagonist to complex sibling.

**The romance subplot with the bookshop owner, Daniel, feels underdeveloped.** He appears in three scenes but has no arc of his own. Either expand his role or consider cutting it entirely—the story is strong enough without a romantic element.

**Some exposition in Chapters 3 and 7 disrupts the narrative flow.** The two-page history of the lighthouse reads like a Wikipedia article. This information could be woven into dialogue or discovered through Evelyn's investigation.`,
    next_steps: `• **Tighten the middle act** by cutting or combining scenes in Chapters 8-12. Aim to reduce this section by 15-20%. Every scene should either advance the mystery or deepen a key relationship.

• **Add one POV chapter from Margot's perspective,** perhaps placed around Chapter 6. Show us the weight of the choices she's made and what she's sacrificed.

• **Either develop Daniel into a full character or remove him.** If you keep him, give him a secret that connects to the main mystery—perhaps he knew something about Evelyn's father.

• **Convert the lighthouse history into a discovered document**—maybe old newspaper clippings Evelyn finds in the attic, or stories told by an elderly neighbor. This makes the exposition active rather than passive.

• **Consider adding a ticking clock element** to the middle act. Perhaps the lighthouse is scheduled for demolition, or Evelyn has a deadline to return to her life in Boston. External pressure will help maintain momentum.`
  };

  showResults(demoResult);
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
  
  // Split into paragraphs
  const paragraphs = html.split(/\n\n+/);
  
  // Group consecutive list items together
  const processed = [];
  let currentList = null;
  let listType = null;
  
  paragraphs.forEach(p => {
    p = p.trim();
    if (!p) return;
    
    // Check if it starts with bullet
    if (p.match(/^[-•]\s/)) {
      if (listType !== 'ul') {
        if (currentList) processed.push(currentList);
        currentList = { type: 'ul', items: [] };
        listType = 'ul';
      }
      // Split by newlines and add each line as item
      p.split(/\n/).forEach(line => {
        line = line.trim();
        if (line.match(/^[-•]\s/)) {
          currentList.items.push(line.replace(/^[-•]\s/, ''));
        }
      });
    }
    // Check if it starts with number
    else if (p.match(/^[\d]+[\.\)]\s/) || p.match(/^•\s/)) {
      if (listType !== 'ul') {
        if (currentList) processed.push(currentList);
        currentList = { type: 'ul', items: [] };
        listType = 'ul';
      }
      p.split(/\n/).forEach(line => {
        line = line.trim();
        if (line.match(/^[\d]+[\.\)]\s/)) {
          currentList.items.push(line.replace(/^[\d]+[\.\)]\s/, ''));
        } else if (line.match(/^•\s/)) {
          currentList.items.push(line.replace(/^•\s/, ''));
        }
      });
    }
    // Regular paragraph
    else {
      if (currentList) {
        processed.push(currentList);
        currentList = null;
        listType = null;
      }
      processed.push({ type: 'p', content: p.replace(/\n/g, '<br>') });
    }
  });
  
  // Don't forget the last list
  if (currentList) processed.push(currentList);
  
  // Convert to HTML
  html = processed.map(item => {
    if (item.type === 'ul') {
      return '<ul>' + item.items.map(i => `<li>${i}</li>`).join('') + '</ul>';
    } else if (item.type === 'ol') {
      return '<ol>' + item.items.map(i => `<li>${i}</li>`).join('') + '</ol>';
    } else {
      return `<p>${item.content}</p>`;
    }
  }).join('');
  
  return html;
}

