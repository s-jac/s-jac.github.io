// Shared project data - edit descriptions here to update everywhere
const PROJECTS = {
  'train-game': {
    title: 'Train Game',
    description: 'A strategy-based board game simulation where players build railway networks and compete for the most efficient routes.'
  },
  'whatsapp-wrapped': {
    title: 'WhatsApp Wrapped',
    description: 'Analyze your WhatsApp chat exports to generate personalized statistics and insights about your messaging habits.'
  },
  'ratemybook': {
    title: 'ratemybook for Authors',
    description: 'An AI-powered tool that provides authors with detailed feedback and scoring on their manuscripts to help improve their writing.'
  },
  'slushsort': {
    title: 'SlushSort for Publishing Houses',
    description: 'A manuscript triage system for publishing houses that uses AI to efficiently sort through submissions and identify promising works.'
  }
};

// Populate page content
document.addEventListener('DOMContentLoaded', function() {
  // For individual project pages (body has data-project)
  const projectId = document.body.dataset.project;
  if (projectId && PROJECTS[projectId]) {
    const project = PROJECTS[projectId];
    
    const titleEl = document.querySelector('.article__title');
    const descEl = document.querySelector('.article__description');
    
    if (titleEl) titleEl.textContent = project.title;
    if (descEl) descEl.textContent = project.description;
  }
  
  // For projects list page (project items have data-project)
  const projectItems = document.querySelectorAll('.project-item[data-project]');
  projectItems.forEach(function(item) {
    const id = item.dataset.project;
    if (PROJECTS[id]) {
      const titleEl = item.querySelector('.project-item__title');
      const tooltipEl = item.querySelector('.project-item__tooltip');
      
      if (titleEl) titleEl.textContent = PROJECTS[id].title;
      if (tooltipEl) tooltipEl.textContent = PROJECTS[id].description;
    }
  });
});

