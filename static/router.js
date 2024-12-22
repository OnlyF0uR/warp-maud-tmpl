document.addEventListener("DOMContentLoaded", () => {
  // Cache for storing fetched content
  const pageCache = new Map();
  let isNavigating = false;

  function updateTitle(newDoc) {
    const newTitle = newDoc.querySelector("title");
    if (newTitle) {
      document.title = newTitle.textContent;
    }
  }

  function updateDynamicLinks(newDoc) {
    const oldLinks = Array.from(
      document.querySelectorAll("link[data-dynamic]"),
    );
    const newLinks = newDoc.querySelectorAll("link[data-dynamic]");

    // Remove links that don't exist in new document
    oldLinks.forEach((link) => {
      if (!Array.from(newLinks).find((newLink) => newLink.isEqualNode(link))) {
        link.remove();
      }
    });

    // Add new links that aren't in current document
    newLinks.forEach((linkNode) => {
      if (!oldLinks.find((oldLink) => oldLink.isEqualNode(linkNode))) {
        const clone = linkNode.cloneNode(true);
        clone.setAttribute("data-dynamic", "true");
        document.head.appendChild(clone);
      }
    });
  }

  function updateDynamicStyles(newDoc) {
    const oldStyles = Array.from(
      document.querySelectorAll("style[data-dynamic]"),
    );
    const newStyles = newDoc.querySelectorAll("style[data-dynamic]");

    // Remove styles that don't exist in new document
    oldStyles.forEach((style) => {
      if (
        !Array.from(newStyles).find((newStyle) => newStyle.isEqualNode(style))
      ) {
        style.remove();
      }
    });

    // Add new styles that aren't in current document
    newStyles.forEach((styleNode) => {
      if (!oldStyles.find((oldStyle) => oldStyle.isEqualNode(styleNode))) {
        const clone = styleNode.cloneNode(true);
        clone.setAttribute("data-dynamic", "true");
        document.head.appendChild(clone);
      }
    });
  }

  async function updateDynamicScripts(newDoc) {
    // Static counter outside function scope
    if (!window._scriptCounter) window._scriptCounter = 0;

    const oldScripts = Array.from(
      document.querySelectorAll("script[data-dynamic]"),
    );
    const newScripts = newDoc.querySelectorAll("script[data-dynamic]");

    oldScripts.forEach((script) => {
      if (
        !Array.from(newScripts).find(
          (newScript) =>
            (script.src && script.src === newScript.src) ||
            (!script.src &&
              script.getAttribute("data-id") ===
                newScript.getAttribute("data-id")),
        )
      ) {
        script.remove();
      }
    });

    for (const scriptNode of newScripts) {
      if (scriptNode.src) {
        const exists = oldScripts.some(
          (oldScript) => oldScript.src === scriptNode.src,
        );
        if (exists) continue;

        const newScript = document.createElement("script");
        newScript.setAttribute("data-dynamic", "true");
        newScript.src = scriptNode.src;

        const parent =
          scriptNode.parentNode.tagName === "HEAD"
            ? document.head
            : document.body;
        parent.appendChild(newScript);
      } else if (scriptNode.textContent) {
        // Check for existing ID or assign new one
        let scriptId = scriptNode.getAttribute("data-id");
        if (!scriptId) {
          scriptId = `script_${window._scriptCounter++}`;
          scriptNode.setAttribute("data-id", scriptId);
        }

        const exists = oldScripts.some(
          (oldScript) => oldScript.getAttribute("data-id") === scriptId,
        );
        if (exists) continue;

        const newScript = document.createElement("script");
        newScript.setAttribute("data-dynamic", "true");
        newScript.setAttribute("data-id", scriptId);

        const wrappedContent = `(function() {
            if (window['${scriptId}']) return;
            window['${scriptId}'] = true;
            ${scriptNode.textContent}
          })();`;
        newScript.textContent = wrappedContent;
        newScript.async = true;

        const parent =
          scriptNode.parentNode.tagName === "HEAD"
            ? document.head
            : document.body;
        parent.appendChild(newScript);
      }
    }
  }

  async function navigate(path, { pushState = true } = {}) {
    if (isNavigating) return;
    isNavigating = true;

    try {
      // Check cache first
      let newDoc;
      if (pageCache.has(path)) {
        newDoc = pageCache.get(path);
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(path, {
            signal: controller.signal,
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const html = await response.text();
          newDoc = new DOMParser().parseFromString(html, "text/html");

          // Cache the parsed document
          pageCache.set(path, newDoc.cloneNode(true));
        } catch (error) {
          if (error.name === "AbortError") {
            throw new Error("Navigation timeout");
          }
          throw error;
        }
      }

      // Update head elements and dynamic resources
      updateDynamicLinks(newDoc);
      updateDynamicStyles(newDoc);
      updateTitle(newDoc);

      // Update content
      const newContent = newDoc.querySelector("#app");
      if (!newContent) {
        throw new Error("New content not found");
      }

      const currentApp = document.querySelector("#app");
      currentApp.innerHTML = newContent.innerHTML;

      // Load scripts
      await updateDynamicScripts(newDoc);

      if (pushState) {
        window.history.pushState({ path }, "", path);
      }

      document.dispatchEvent(
        new CustomEvent("navigation", {
          detail: { path, success: true },
        }),
      );
    } catch (error) {
      console.error("Navigation error:", error);
      document.dispatchEvent(
        new CustomEvent("navigation", {
          detail: { path, success: false, error },
        }),
      );
    } finally {
      isNavigating = false;
    }
  }

  // Click handler for navigation
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (!target) return;

    if (target.href && target.origin === window.location.origin) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (target.hasAttribute("download") || target.target) return;

      e.preventDefault();
      navigate(target.pathname);
    }
  });

  // Handle back/forward navigation
  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.path) {
      navigate(e.state.path, { pushState: false });
    }
  });

  // Cache the initial page
  pageCache.set(window.location.pathname, document.cloneNode(true));
});
