/**
 * GoatCounter Page Views Display
 * Fetches and displays view count for blog posts
 */

(function() {
  'use strict';

  const GOATCOUNTER_SITE = 's-jac.goatcounter.com';

  /**
   * Fetch page views from GoatCounter API
   * @returns {Promise<number|null>} View count or null if unavailable
   */
  async function fetchPageViews() {
    const path = window.location.pathname;
    
    try {
      // Note: GoatCounter expects the path without encoding slashes
      const response = await fetch(
        `https://${GOATCOUNTER_SITE}/counter/${path}.json`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.count;
    } catch (error) {
      // Silently fail - likely blocked by ad blocker or network issue
      // This is expected for many users and not a real error
      return null;
    }
  }

  /**
   * Format view count with appropriate label
   * @param {number} count - Number of views
   * @returns {string} Formatted string
   */
  function formatViewCount(count) {
    const views = count.toLocaleString();
    return count === 1 ? `${views} view` : `${views} views`;
  }

  /**
   * Initialize view counter on page load
   */
  async function init() {
    const viewCountEl = document.getElementById('page-views');
    if (!viewCountEl) return;

    const count = await fetchPageViews();
    
    if (count !== null) {
      viewCountEl.textContent = formatViewCount(count);
      viewCountEl.classList.add('article__views--loaded');
    } else {
      // Hide the separator and views element if no data
      viewCountEl.style.display = 'none';
      const separator = document.querySelector('.article__meta-separator');
      if (separator) separator.style.display = 'none';
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

