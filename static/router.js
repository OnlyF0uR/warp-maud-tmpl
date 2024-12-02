// Ensure that this runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Intercept link clicks and prevent full-page reload
  document.body.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (target && target.href && target.origin === window.location.origin) {
      e.preventDefault(); // Prevent the full page reload
      navigate(target.pathname); // Call navigate function
    }
  });

  // Handle the browser's back/forward button using popstate
  window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
  });

  // The navigate function to dynamically load content
  async function navigate(path) {
    try {
      // Fetch the new content (only the #app div)
      const response = await fetch(path);

      if (response.ok) {
        const html = await response.text();

        // Use DOMParser to parse the new content and extract only the #app div
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');
        const newContent = newDoc.querySelector('#app');

        if (newContent) {
          // Update the current #app div with the new content
          document.querySelector('#app').innerHTML = newContent.innerHTML;
        }

        // Update the browser history without reloading the page
        window.history.pushState({}, '', path);
      } else {
        console.error('Failed to load content:', response.status);
      }
    } catch (err) {
      console.error('Error during navigation:', err);
    }
  }
});
