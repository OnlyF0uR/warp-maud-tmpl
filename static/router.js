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

  // Function to update dynamic styles in the head
  function updateDynamicStyles(newDoc) {
    const oldStyles = Array.from(
      document.querySelectorAll('style[data-dynamic]')
    );

    // Add new <style> elements from the new document
    const newStyles = newDoc.querySelectorAll('style[data-dynamic]');
    document.querySelectorAll('style[data-dynamic]').forEach(function (style) {
      if (
        !Array.from(newStyles).find((newStyle) => newStyle.isEqualNode(style))
      ) {
        style.remove();
      }
    });

    for (const styleNode of newStyles) {
      if (oldStyles.find((oldStyle) => oldStyle.isEqualNode(styleNode))) {
        continue;
      }

      styleNode.remove();

      const clone = styleNode.cloneNode(true);
      // clone.setAttribute('data-dynamic', 'true'); // Mark as dynamic for cleanup
      document.head.appendChild(clone);
    }
  }

  // Execute inline script content
  function executeInlineScript(scriptContent) {
    const script = document.createElement('script');
    script.textContent = scriptContent;
    document.body.appendChild(script);
  }

  // Dynamically load and execute scripts
  async function updateDynamicScripts(newDoc) {
    // clearDynamicScripts();
    const oldScripts = Array.from(
      document.querySelectorAll('script[data-dynamic]')
    );

    const newScripts = newDoc.querySelectorAll('script[data-dynamic]');
    document
      .querySelectorAll('script[data-dynamic]')
      .forEach(function (script) {
        if (
          !Array.from(newScripts).find((newScript) =>
            newScript.isEqualNode(script)
          )
        ) {
          script.remove();
        }
      });

    for (const scriptNode of newScripts) {
      if (oldScripts.find((oldScript) => oldScript.isEqualNode(scriptNode))) {
        continue;
      }

      scriptNode.remove();

      if (scriptNode.src) {
        // Handle external scripts
        const newScript = document.createElement('script');
        newScript.src = scriptNode.src;
        // newScript.setAttribute('data-dynamic', 'true');
        newScript.async = true;
        document.body.appendChild(newScript);
      } else if (scriptNode.textContent) {
        // Handle inline scripts
        executeInlineScript(scriptNode.textContent);
      }
    }
  }

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

        updateDynamicStyles(newDoc);

        const newContent = newDoc.querySelector('#app');

        if (newContent) {
          // Update the current #app div with the new content
          document.querySelector('#app').innerHTML = newContent.innerHTML;
        }

        updateDynamicScripts(newDoc);

        // Update the browser history without reloading the page
        window.history.pushState({}, '', path);

        const event = new CustomEvent('navigation', {
          detail: { path },
        });
        document.dispatchEvent(event);
        console.log('Navigated to:', path);
      } else {
        console.error('Failed to load content:', response.status);
      }
    } catch (err) {
      console.error('Error during navigation:', err);
    }
  }
});
