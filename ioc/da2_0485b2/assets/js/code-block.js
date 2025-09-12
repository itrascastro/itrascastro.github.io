document.addEventListener("DOMContentLoaded", () => {
  const blocks = document.querySelectorAll(".code-block");

  blocks.forEach(block => {
    const code = block.querySelector("code");
    const pre = block.querySelector("pre");
    const lineNumbersEl = block.querySelector(".line-numbers");
    const toggleBtn = block.querySelector(".toggle-lines");
    const toggleExpandBtn = block.querySelector(".toggle-expand");
    const copyBtn = block.querySelector(".copy-btn");

    // Obtenir codi original abans de qualsevol processament
    const originalCode = code.textContent;
    const lines = originalCode.split("\n");
    const lineCount = lines.length;

    // Dimensionar columna segons dígits
    const digits = String(lineCount).length;
    if (lineNumbersEl) {
      lineNumbersEl.style.width = `${digits + 2}ch`;
    }

    // Generar números de línia amb DocumentFragment per rendiment
    if (lineNumbersEl) {
      lineNumbersEl.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= lineCount; i++) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'ln';
        lineDiv.textContent = i;
        frag.appendChild(lineDiv);
      }
      lineNumbersEl.appendChild(frag);
    }

    // Processar highlight de línies específiques si existeix
    const highlightData = block.getAttribute("data-highlight");
    if (highlightData) {
      highlightLines(code, lineNumbersEl, highlightData);
    }

    // Sincronitzar scroll vertical
    pre.addEventListener("scroll", () => {
      if (lineNumbersEl) lineNumbersEl.scrollTop = pre.scrollTop;
    });

    // Mostrar/Ocultar números de línia
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        block.classList.toggle("lines-hidden");
        const isHidden = block.classList.contains("lines-hidden");
        toggleBtn.setAttribute("aria-pressed", String(!isHidden));
      });
    }

    // (Eliminat) Ajust de línia (wrap): ja no s'ofereix com a control

    // Expandir/Col·lapsar alçada
    if (toggleExpandBtn) {
      toggleExpandBtn.addEventListener("click", () => {
        block.classList.toggle("expanded");
        const isExpanded = block.classList.contains("expanded");
        toggleExpandBtn.setAttribute("aria-pressed", String(isExpanded));
        const icon = toggleExpandBtn.querySelector('i');
        if (icon) {
          icon.className = isExpanded ? 'bi bi-fullscreen-exit' : 'bi bi-arrows-fullscreen';
        }
      });
    }

    // Copiar codi amb millor feedback
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(originalCode);
        showCopyFeedback(copyBtn, true);
      } catch (err) {
        // Fallback per navegadors sense Clipboard API
        try {
          const textArea = document.createElement('textarea');
          textArea.value = originalCode;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          showCopyFeedback(copyBtn, successful);
        } catch (fallbackErr) {
          showCopyFeedback(copyBtn, false);
        }
      }
    });
  });

  // Funció per highlight de línies específiques
  function highlightLines(codeElement, lineNumbersEl, highlightData) {
    const ranges = parseHighlightRanges(highlightData);
    const lines = codeElement.innerHTML.split('\n');
    const lineNumberDivs = lineNumbersEl ? lineNumbersEl.querySelectorAll('.ln') : [];
    
    ranges.forEach(range => {
      for (let i = range.start - 1; i < range.end && i < lines.length; i++) {
        // Highlight la línia de codi
        if (lines[i] !== undefined) {
          lines[i] = `<span class="line-highlight">${lines[i]}</span>`;
        }
        // Highlight el número de línia
        if (lineNumberDivs[i]) {
          lineNumberDivs[i].classList.add('ln-highlight');
        }
      }
    });
    
    codeElement.innerHTML = lines.join('\n');
  }

  // Parsejar rangs de highlight (ex: "1-3,5,7-9")
  function parseHighlightRanges(highlightData) {
    const ranges = [];
    const parts = highlightData.split(',');
    
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        ranges.push({ start, end });
      } else {
        const lineNum = parseInt(part);
        ranges.push({ start: lineNum, end: lineNum });
      }
    });
    
    return ranges;
  }

  // Millor feedback visual per còpia
  function showCopyFeedback(button, success) {
    const originalContent = button.innerHTML;
    
    if (success) {
      button.innerHTML = '<i class="bi bi-clipboard-check" aria-hidden="true"></i>';
      button.classList.add('copied');
      button.setAttribute('aria-label', 'Codi copiat correctament');
    } else {
      button.innerHTML = '<i class="bi bi-x-circle" aria-hidden="true"></i>';
      button.setAttribute('aria-label', 'Error en copiar el codi');
    }
    
    setTimeout(() => {
      button.innerHTML = '<i class="bi bi-clipboard" aria-hidden="true"></i>';
      button.classList.remove('copied');
      button.setAttribute('aria-label', 'Copiar codi');
    }, 2000);
  }
});
