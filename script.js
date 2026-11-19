const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const revealItems = document.querySelectorAll('.reveal');
const yearNode = document.getElementById('year');
const contactForm = document.getElementById('contact-form');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const slideCards = Array.from(document.querySelectorAll('.slide-card'));
const sliderDots = Array.from(document.querySelectorAll('.slider-dot'));
const prevButton = document.querySelector('.slider-btn.prev');
const nextButton = document.querySelector('.slider-btn.next');

let currentSlide = 0;

function showSlide(index) {
  if (!slideCards.length) return;

  currentSlide = (index + slideCards.length) % slideCards.length;

  slideCards.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === currentSlide);
  });

  sliderDots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlide);
  });
}

prevButton?.addEventListener('click', () => showSlide(currentSlide - 1));
nextButton?.addEventListener('click', () => showSlide(currentSlide + 1));

sliderDots.forEach((dot, index) => {
  dot.addEventListener('click', () => showSlide(index));
});

if (slideCards.length && !prefersReducedMotion) {
  setInterval(() => showSlide(currentSlide + 1), 5000);
}

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get('name')?.toString().trim() || 'Cliente';
  const area = formData.get('area')?.toString().trim() || 'Consulta';
  const message = formData.get('message')?.toString().trim() || 'Quiero información sobre la asociación';
  const phone = formData.get('phone')?.toString().trim() || '51987654321';
  const button = contactForm.querySelector('button[type="submit"]');
  const originalText = button.textContent;

  button.textContent = 'Solicitud enviada';
  button.disabled = true;

  const whatsappText = encodeURIComponent(
    `Hola T.P.P.G., mi nombre es ${name}. Estoy interesado en ${area}. ${message}. Mi celular es ${phone}.`
  );

  window.open(`https://wa.me/51987654321?text=${whatsappText}`, '_blank');

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    contactForm.reset();
  }, 1800);
});

(() => {
  const ADMIN_SESSION_KEY = 'atpp-demo-session';
  const DATABASE_NAME = 'atpp-community';
  const DATABASE_VERSION = 1;
  const MAX_NEWS_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_SHARED_FILE_SIZE = 25 * 1024 * 1024;
  const ALLOWED_NEWS_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  const ALLOWED_FILE_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'jpg', 'jpeg', 'png', 'txt', 'csv', 'zip'
  ];

  const authAction = document.getElementById('auth-action');
  const loginDialog = document.getElementById('login-dialog');
  const newsDialog = document.getElementById('news-dialog');
  const fileDialog = document.getElementById('file-dialog');
  const loginForm = document.getElementById('login-form');
  const newsForm = document.getElementById('news-form');
  const fileForm = document.getElementById('file-form');
  const loginMessage = document.getElementById('login-message');
  const newsMessage = document.getElementById('news-message');
  const fileMessage = document.getElementById('file-message');
  const newsCarouselControls = document.getElementById('news-carousel-controls');
  const newsCarouselDots = document.getElementById('news-carousel-dots');
  const newsCarouselPosition = document.getElementById('news-carousel-position');
  const newsPreviousButton = document.getElementById('news-previous');
  const newsNextButton = document.getElementById('news-next');
  const newsCarouselMobileQuery = window.matchMedia('(max-width: 760px)');
  const newsFeed = document.getElementById('news-feed');
  const filesList = document.getElementById('files-list');
  const fileSearchInput = document.getElementById('file-search');
  const fileCategoryFilter = document.getElementById('file-category-filter');
  const fileSortFilter = document.getElementById('file-sort-filter');
  const filesCount = document.getElementById('files-count');
  const toastRegion = document.getElementById('toast-region');
  const newNewsButton = document.getElementById('new-news-button');
  const newFileButton = document.getElementById('new-file-button');
  const newsFormTitle = document.getElementById('news-form-title');
  const fileFormTitle = document.getElementById('file-form-title');
  const newsSubmitButton = newsForm?.querySelector('[type="submit"]');
  const fileSubmitButton = fileForm?.querySelector('[type="submit"]');
  const sharedFileInput = fileForm?.elements.namedItem('file');
  let editingNewsId = null;
  let editingFileId = null;
  let currentNewsPage = 0;
  let currentUser = readDemoSession();
  let databasePromise;
  let fileSearchTimeout;
  let renderGeneration = 0;
  let filesRenderGeneration = 0;
  const renderedImageUrls = [];
  const renderedFileUrls = [];

  function readDemoSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null');
      return session?.role === 'admin' && session?.username === 'admin'
        ? { ...session, displayName: 'Administrador T.P.P.G.' }
        : null;
    } catch (error) {
      console.error('No se pudo leer la sesión de demostración.', error);
      return null;
    }
  }

  class DemoAuthProvider {
    async signIn(username, password) {
      if (username !== 'admin' || password !== '1234') {
        throw new Error('El usuario o la contraseña son incorrectos.');
      }

      return { username: 'admin', displayName: 'Administrador T.P.P.G.', role: 'admin' };
    }

    async signOut() {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }

  class IndexedDbCommunityRepository {
    open() {
      if (!databasePromise) {
        databasePromise = new Promise((resolve, reject) => {
          if (!window.indexedDB) {
            reject(new Error('Este navegador no permite almacenamiento local de archivos.'));
            return;
          }

          const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
          request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains('news')) {
              database.createObjectStore('news', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('files')) {
              database.createObjectStore('files', { keyPath: 'id' });
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error || new Error('No se pudo abrir la base local.'));
          request.onblocked = () => reject(new Error('Cierra otras pestañas del sitio y vuelve a intentarlo.'));
        });
      }

      return databasePromise;
    }

    async getAll(storeName) {
      const database = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const request = transaction.objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('No se pudieron consultar los datos.'));
        transaction.onerror = () => reject(transaction.error || new Error('Falló la consulta local.'));
      });
    }

    async get(storeName, id) {
      const database = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const request = transaction.objectStore(storeName).get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('No se pudo consultar el elemento.'));
        transaction.onerror = () => reject(transaction.error || new Error('Falló la consulta local.'));
      });
    }

    async save(storeName, record) {
      const database = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).put(record);
        transaction.oncomplete = () => resolve(record);
        transaction.onerror = () => reject(transaction.error || new Error('No se pudo guardar el elemento.'));
        transaction.onabort = () => reject(transaction.error || new Error('Se canceló el guardado.'));
      });
    }

    async remove(storeName, id) {
      const database = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).delete(id);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error('No se pudo eliminar el elemento.'));
        transaction.onabort = () => reject(transaction.error || new Error('Se canceló la eliminación.'));
      });
    }
  }

  const authProvider = new DemoAuthProvider();
  const repository = new IndexedDbCommunityRepository();

  function isAdmin() {
    return currentUser?.role === 'admin';
  }

  function updateAuthControls() {
    const adminControls = document.querySelectorAll('.admin-only');
    adminControls.forEach((control) => {
      control.hidden = !isAdmin();
    });
    if (authAction) {
      authAction.textContent = isAdmin() ? 'Cerrar sesión' : 'Iniciar sesión';
      authAction.setAttribute('aria-label', authAction.textContent);
    }
  }

  function showToast(message, isError = false) {
    if (!toastRegion) return;
    const toast = document.createElement('div');
    toast.className = `toast${isError ? ' error' : ''}`;
    toast.textContent = message;
    toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 4800);
  }

  function setFormLoading(button, isLoading, label) {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = label;
      button.disabled = true;
      button.classList.add('is-loading');
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      button.classList.remove('is-loading');
      delete button.dataset.originalText;
    }
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(value));
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
  }

  function getExtension(fileName) {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  function validateFile(file, allowedExtensions, maxSize) {
    if (!file) return 'Selecciona un archivo.';
    if (!allowedExtensions.includes(getExtension(file.name))) {
      return `El formato .${getExtension(file.name) || 'desconocido'} no está permitido.`;
    }
    if (file.size === 0) return 'El archivo está vacío.';
    if (file.size > maxSize) return `El archivo supera el límite de ${formatSize(maxSize)}.`;
    return '';
  }

  function safeHttpUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const url = new URL(trimmed);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
      return null;
    }
  }

  function getYouTubeThumbnailUrl(videoUrl) {
    try {
      const url = new URL(videoUrl);
      const host = url.hostname.toLowerCase();
      const youtubeHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'];
      if (!youtubeHosts.includes(host)) return '';

      const pathSegments = url.pathname.split('/').filter(Boolean);
      let videoId = '';
      if (host.endsWith('youtu.be')) {
        videoId = pathSegments[0] || '';
      } else if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else if (['embed', 'shorts', 'live', 'v'].includes(pathSegments[0])) {
        videoId = pathSegments[1] || '';
      }

      if (!/^[\w-]{11}$/.test(videoId)) return '';
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } catch {
      return '';
    }
  }

  async function getArticleImageUrl(articleUrl) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(articleUrl, { signal: controller.signal });
      if (!response.ok) return '';
      const contentType = response.headers.get('content-type') || '';
      if (contentType && !/(text\/html|application\/xhtml\+xml)/i.test(contentType)) return '';

      const html = await response.text();
      const document = new DOMParser().parseFromString(html, 'text/html');
      const imageContent = [
        'meta[property="og:image"]',
        'meta[property="og:image:secure_url"]',
        'meta[name="twitter:image"]',
        'meta[name="twitter:image:src"]'
      ]
        .map((selector) => document.querySelector(selector)?.getAttribute('content')?.trim())
        .find(Boolean);
      if (!imageContent) return '';

      return safeHttpUrl(new URL(imageContent, response.url || articleUrl).href) || '';
    } catch (error) {
      console.warn('No se pudo leer la imagen destacada del enlace; se publicará sin imagen automática.', error);
      return '';
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function appendText(parent, tagName, text, className) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function appendExternalLink(parent, url, label, className) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    if (className) link.className = className;
    parent.append(link);
    return link;
  }

  function addAdminActions(parent, kind, id) {
    if (!isAdmin()) return;
    const actions = document.createElement('div');
    actions.className = kind === 'news' ? 'news-card-actions' : 'file-card-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'small-button';
    edit.dataset.action = `edit-${kind}`;
    edit.dataset.id = id;
    edit.textContent = 'Editar';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'small-button danger';
    remove.dataset.action = `delete-${kind}`;
    remove.dataset.id = id;
    remove.textContent = 'Eliminar';
    actions.append(edit, remove);
    parent.append(actions);
  }

  function clearRenderedImageUrls() {
    renderedImageUrls.forEach((url) => URL.revokeObjectURL(url));
    renderedImageUrls.length = 0;
  }

  function showNewsSlide(pageIndex) {
    const cards = Array.from(newsFeed?.querySelectorAll('.news-card') || []);
    if (!cards.length) return;

    const cardsPerPage = newsCarouselMobileQuery.matches ? 1 : 2;
    const pageCount = Math.ceil(cards.length / cardsPerPage);
    currentNewsPage = (pageIndex + pageCount) % pageCount;
    const firstCardIndex = currentNewsPage * cardsPerPage;
    const lastCardIndex = Math.min(firstCardIndex + cardsPerPage, cards.length);
    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex >= firstCardIndex && cardIndex < lastCardIndex;
      card.hidden = !isActive;
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', `Noticia ${cardIndex + 1} de ${cards.length}`);
      card.setAttribute('aria-roledescription', 'diapositiva');
    });

    newsCarouselDots?.querySelectorAll('button').forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentNewsPage;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', String(isActive));
    });
    if (newsCarouselPosition) {
      newsCarouselPosition.textContent = `${String(firstCardIndex + 1).padStart(2, '0')}-${String(lastCardIndex).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    }
  }

  function renderNewsCarouselControls() {
    const cards = Array.from(newsFeed?.querySelectorAll('.news-card') || []);
    if (!newsCarouselControls || !newsCarouselDots) return;

    newsCarouselControls.hidden = cards.length === 0;
    newsCarouselDots.replaceChildren();
    if (!cards.length) return;

    const cardsPerPage = newsCarouselMobileQuery.matches ? 1 : 2;
    const pageCount = Math.ceil(cards.length / cardsPerPage);
    currentNewsPage = Math.min(currentNewsPage, pageCount - 1);
    for (let page = 0; page < pageCount; page += 1) {
      const firstCardIndex = page * cardsPerPage;
      const lastCardIndex = Math.min(firstCardIndex + cardsPerPage, cards.length);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'news-carousel-dot';
      dot.dataset.newsPage = String(page);
      dot.setAttribute('aria-label', `Ir a las noticias ${firstCardIndex + 1} a ${lastCardIndex}`);
      newsCarouselDots.append(dot);
    }
    if (newsPreviousButton) newsPreviousButton.disabled = pageCount < 2;
    if (newsNextButton) newsNextButton.disabled = pageCount < 2;
    showNewsSlide(currentNewsPage);
  }

  function addNewsMediaFallback(media) {
    media.classList.add('news-card-media--empty');
    const fallback = document.createElement('div');
    fallback.className = 'news-card-media-fallback';
    fallback.setAttribute('aria-hidden', 'true');
    appendText(fallback, 'span', 'T.P.P.G.', 'news-card-media-mark');
    appendText(fallback, 'span', 'Actualidad de nuestra comunidad', 'news-card-media-caption');
    media.append(fallback);
  }

  async function renderNews() {
    if (!newsFeed) return;
    const generation = ++renderGeneration;
    const news = (await repository.getAll('news')).sort((a, b) => b.publishedAt - a.publishedAt);
    if (generation !== renderGeneration) return;
    clearRenderedImageUrls();
    newsFeed.replaceChildren();
    if (!news.length) {
      appendText(newsFeed, 'p', 'Aún no hay publicaciones. Vuelve pronto para conocer las novedades de T.P.P.G.', 'empty-state');
      renderNewsCarouselControls();
      return;
    }

    news.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'news-card';
      const media = document.createElement('div');
      media.className = 'news-card-media';
      if (item.imageBlob || item.imageUrl) {
        const image = document.createElement('img');
        image.className = 'news-card-image';
        image.loading = 'lazy';
        image.alt = item.title;
        if (item.imageBlob) {
          image.src = URL.createObjectURL(item.imageBlob);
          renderedImageUrls.push(image.src);
        } else {
          image.src = item.imageUrl;
          image.referrerPolicy = 'no-referrer';
        }
        image.addEventListener('error', () => {
          image.remove();
          addNewsMediaFallback(media);
        }, { once: true });
        media.append(image);
      } else {
        addNewsMediaFallback(media);
      }
      const content = document.createElement('div');
      content.className = 'news-card-content';
      appendText(content, 'div', 'Actualidad T.P.P.G.', 'tag');
      appendText(content, 'h4', item.title);
      const descriptionText = item.description || '';
      appendText(content, 'p', descriptionText, 'news-card-description');
      if (descriptionText.length > 220) {
        const toggleDescription = document.createElement('button');
        toggleDescription.type = 'button';
        toggleDescription.className = 'news-card-read-more';
        toggleDescription.dataset.newsDescriptionToggle = '';
        toggleDescription.setAttribute('aria-expanded', 'false');
        toggleDescription.textContent = 'Ver más';
        content.append(toggleDescription);
      }
      const meta = document.createElement('div');
      meta.className = 'news-card-meta';
      appendText(meta, 'span', formatDate(item.publishedAt));
      appendText(meta, 'span', `Publicado por ${item.author}`);
      content.append(meta);

      if (item.socialUrl) {
        const preview = document.createElement('div');
        preview.className = 'social-preview';
        const host = new URL(item.socialUrl).hostname.replace(/^www\./, '');
        appendExternalLink(preview, item.socialUrl, `Vista previa del enlace · ${host}`);
        content.append(preview);
      }

      if (item.externalLinks?.length) {
        const links = document.createElement('div');
        links.className = 'news-card-links';
        item.externalLinks.forEach((url) => {
          const host = new URL(url).hostname.replace(/^www\./, '');
          appendExternalLink(links, url, `Ver enlace · ${host}`);
        });
        content.append(links);
      }

      addAdminActions(content, 'news', item.id);
      card.append(media, content);
      newsFeed.append(card);
    });
    renderNewsCarouselControls();
  }

  function createFileTypePreview(extension) {
    const preview = document.createElement('div');
    preview.className = 'file-card-visual file-type-preview';
    preview.setAttribute('aria-hidden', 'true');
    appendText(preview, 'span', extension.toUpperCase(), 'file-type-extension');
    appendText(preview, 'span', 'Archivo', 'file-type-caption');
    return preview;
  }

  async function renderFiles() {
    if (!filesList) return;
    const generation = ++filesRenderGeneration;
    const selectedCategory = fileCategoryFilter?.value || '';
    const searchTerm = fileSearchInput?.value.trim().toLocaleLowerCase('es') || '';
    const sortOrder = fileSortFilter?.value || 'newest';
    const allFiles = await repository.getAll('files');
    if (generation !== filesRenderGeneration) return;

    renderedFileUrls.forEach((url) => URL.revokeObjectURL(url));
    renderedFileUrls.length = 0;
    const files = allFiles
      .filter((item) => !selectedCategory || item.category === selectedCategory)
      .filter((item) => {
        if (!searchTerm) return true;
        const searchableText = [item.title, item.description, item.fileName, item.category, item.extension]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('es');
        return searchableText.includes(searchTerm);
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.publishedAt - b.publishedAt;
        if (sortOrder === 'title') return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
        return b.publishedAt - a.publishedAt;
      });

    if (filesCount) {
      const totalLabel = allFiles.length === 1 ? 'archivo' : 'archivos';
      filesCount.textContent = searchTerm || selectedCategory
        ? `${files.length} de ${allFiles.length} ${totalLabel}`
        : `${allFiles.length} ${totalLabel} disponibles`;
    }
    filesList.replaceChildren();
    if (!files.length) {
      const emptyMessage = searchTerm || selectedCategory
        ? 'No hay archivos que coincidan con los filtros seleccionados.'
        : 'Aún no hay archivos compartidos.';
      appendText(filesList, 'p', emptyMessage, 'empty-state');
      return;
    }

    files.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'file-card';
      let visual;
      if (item.mimeType?.startsWith('image/') && item.blob) {
        visual = document.createElement('img');
        const previewUrl = URL.createObjectURL(item.blob);
        renderedFileUrls.push(previewUrl);
        visual.className = 'file-card-visual file-image-preview';
        visual.src = previewUrl;
        visual.alt = `Vista previa: ${item.title}`;
        visual.loading = 'lazy';
        visual.addEventListener('error', () => {
          visual.replaceWith(createFileTypePreview(item.extension));
        }, { once: true });
      } else {
        visual = createFileTypePreview(item.extension);
      }
      card.append(visual);
      const info = document.createElement('div');
      info.className = 'file-card-info';
      appendText(info, 'h3', item.title);
      if (item.description) {
        appendText(info, 'p', item.description, 'file-card-description');
        if (item.description.length > 180) {
          const toggleDescription = document.createElement('button');
          toggleDescription.type = 'button';
          toggleDescription.className = 'file-card-read-more';
          toggleDescription.dataset.fileDescriptionToggle = '';
          toggleDescription.setAttribute('aria-expanded', 'false');
          toggleDescription.textContent = 'Ver más';
          info.append(toggleDescription);
        }
      }
      const meta = document.createElement('div');
      meta.className = 'file-card-meta';
      appendText(meta, 'span', item.category, 'file-category-label');
      appendText(meta, 'span', item.extension.toUpperCase(), 'file-format-label');
      appendText(meta, 'span', formatDate(item.publishedAt));
      appendText(meta, 'span', formatSize(item.size));
      info.append(meta);

      const actions = document.createElement('div');
      actions.className = 'file-card-actions';
      const download = document.createElement('button');
      download.type = 'button';
      download.className = 'button button-secondary';
      download.dataset.action = 'download-file';
      download.dataset.id = item.id;
      download.textContent = 'Descargar';
      actions.append(download);
      card.append(info, actions);
      addAdminActions(card, 'file', item.id);
      filesList.append(card);
    });
  }

  async function renderAll() {
    try {
      await Promise.all([renderNews(), renderFiles()]);
    } catch (error) {
      console.error('No se pudo cargar el contenido compartido.', error);
      showToast(error.message || 'No se pudo cargar el contenido guardado en este navegador.', true);
      if (newsFeed) appendText(newsFeed, 'p', 'No se pudieron cargar las publicaciones. Recarga la página para volver a intentar.', 'empty-state');
      if (filesList) appendText(filesList, 'p', 'No se pudieron cargar los archivos. Recarga la página para volver a intentar.', 'empty-state');
    }
  }

  function resetNewsForm() {
    newsForm?.reset();
    editingNewsId = null;
    if (newsFormTitle) newsFormTitle.textContent = 'Publicar noticia';
    if (newsSubmitButton) newsSubmitButton.textContent = 'Publicar noticia';
    if (newsMessage) newsMessage.textContent = '';
  }

  function resetFileForm() {
    fileForm?.reset();
    editingFileId = null;
    if (sharedFileInput) sharedFileInput.required = true;
    if (fileFormTitle) fileFormTitle.textContent = 'Subir archivo';
    if (fileSubmitButton) fileSubmitButton.textContent = 'Subir y publicar';
    if (fileMessage) fileMessage.textContent = '';
  }

  authAction?.addEventListener('click', async () => {
    if (isAdmin()) {
      try {
        await authProvider.signOut();
        currentUser = null;
        updateAuthControls();
        await renderAll();
        showToast('Sesión cerrada.');
      } catch (error) {
        console.error('No se pudo cerrar la sesión.', error);
        showToast(error.message || 'No se pudo cerrar la sesión.', true);
      }
      return;
    }
    if (loginMessage) loginMessage.textContent = '';
    loginDialog?.showModal();
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (loginMessage) loginMessage.textContent = '';
    const button = loginForm.querySelector('[type="submit"]');
    setFormLoading(button, true, 'Validando...');
    try {
      const formData = new FormData(loginForm);
      currentUser = await authProvider.signIn(
        formData.get('username').toString().trim(),
        formData.get('password').toString()
      );
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(currentUser));
      loginDialog?.close();
      loginForm.reset();
      updateAuthControls();
      await renderAll();
      showToast('Sesión iniciada como administrador.');
    } catch (error) {
      if (loginMessage) loginMessage.textContent = error.message || 'No se pudo iniciar sesión.';
    } finally {
      setFormLoading(button, false, '');
    }
  });

  newNewsButton?.addEventListener('click', () => {
    if (!isAdmin()) return;
    resetNewsForm();
    newsDialog?.showModal();
  });

  newFileButton?.addEventListener('click', () => {
    if (!isAdmin()) return;
    resetFileForm();
    fileDialog?.showModal();
  });

  newsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) return;
    if (newsMessage) newsMessage.textContent = '';
    const formData = new FormData(newsForm);
    const image = formData.get('image');
    const socialInput = formData.get('socialUrl').toString().trim();
    const socialUrl = safeHttpUrl(socialInput);
    const externalInputs = formData.get('externalLinks').toString().split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    const externalLinks = externalInputs.map(safeHttpUrl);
    if (socialInput && !socialUrl) {
      if (newsMessage) newsMessage.textContent = 'El enlace de red social debe comenzar con http:// o https://.';
      return;
    }
    if (externalLinks.some((url) => !url)) {
      if (newsMessage) newsMessage.textContent = 'Cada enlace externo debe ser una dirección http:// o https:// válida.';
      return;
    }
    if (image?.size) {
      const validationMessage = validateFile(image, ALLOWED_NEWS_IMAGE_EXTENSIONS, MAX_NEWS_IMAGE_SIZE);
      if (validationMessage) {
        if (newsMessage) newsMessage.textContent = validationMessage;
        return;
      }
    }

    const shouldTryArticleImage = !image?.size && Boolean(socialUrl);
    setFormLoading(newsSubmitButton, true, shouldTryArticleImage ? 'Buscando imagen...' : 'Publicando...');
    try {
      const wasEditing = Boolean(editingNewsId);
      const previous = editingNewsId ? await repository.get('news', editingNewsId) : null;
      const existingImage = previous?.imageBlob || previous?.imageUrl || null;
      let imageUrl = '';
      if (!image?.size && !existingImage && socialUrl) {
        imageUrl = getYouTubeThumbnailUrl(socialUrl) || await getArticleImageUrl(socialUrl);
      }
      if (newsSubmitButton && shouldTryArticleImage) newsSubmitButton.textContent = 'Publicando...';
      const record = {
        id: editingNewsId || crypto.randomUUID(),
        title: formData.get('title').toString().trim(),
        description: formData.get('description').toString().trim(),
        socialUrl: socialUrl || '',
        externalLinks,
        imageBlob: image?.size ? image : previous?.imageBlob || null,
        imageUrl: image?.size ? '' : previous?.imageUrl || imageUrl,
        publishedAt: previous?.publishedAt || Date.now(),
        updatedAt: Date.now(),
        author: previous?.author || currentUser.displayName
      };
      await repository.save('news', record);
      newsDialog?.close();
      resetNewsForm();
      await renderAll();
      showToast(wasEditing ? 'Noticia actualizada.' : 'Noticia publicada.');
      if (shouldTryArticleImage && !imageUrl && !existingImage) {
        showToast('No se pudo obtener la imagen automáticamente. El sitio puede bloquear la lectura del enlace; puedes adjuntar una imagen manualmente.', true);
      }
    } catch (error) {
      console.error('No se pudo guardar la noticia.', error);
      if (newsMessage) newsMessage.textContent = error.message || 'No se pudo guardar la noticia.';
    } finally {
      setFormLoading(newsSubmitButton, false, '');
    }
  });

  fileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isAdmin()) return;
    if (fileMessage) fileMessage.textContent = '';
    const formData = new FormData(fileForm);
    const file = formData.get('file');
    if (file?.size) {
      const validationMessage = validateFile(file, ALLOWED_FILE_EXTENSIONS, MAX_SHARED_FILE_SIZE);
      if (validationMessage) {
        if (fileMessage) fileMessage.textContent = validationMessage;
        return;
      }
    }
    if (!editingFileId && !file?.size) {
      if (fileMessage) fileMessage.textContent = 'Selecciona el documento que deseas compartir.';
      return;
    }

    setFormLoading(fileSubmitButton, true, 'Subiendo...');
    try {
      const wasEditing = Boolean(editingFileId);
      const previous = editingFileId ? await repository.get('files', editingFileId) : null;
      const record = {
        id: editingFileId || crypto.randomUUID(),
        title: formData.get('title').toString().trim(),
        description: formData.get('description').toString().trim(),
        category: formData.get('category').toString(),
        blob: file?.size ? file : previous.blob,
        fileName: file?.size ? file.name : previous.fileName,
        extension: file?.size ? getExtension(file.name) : previous.extension,
        mimeType: file?.size ? file.type : previous.mimeType,
        size: file?.size ? file.size : previous.size,
        publishedAt: previous?.publishedAt || Date.now(),
        updatedAt: Date.now()
      };
      await repository.save('files', record);
      fileDialog?.close();
      resetFileForm();
      await renderAll();
      showToast(wasEditing ? 'Información del archivo actualizada.' : 'Archivo publicado.');
    } catch (error) {
      console.error('No se pudo guardar el archivo.', error);
      if (fileMessage) fileMessage.textContent = error.message || 'No se pudo guardar el archivo.';
    } finally {
      setFormLoading(fileSubmitButton, false, '');
    }
  });

  async function handleCommunityAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'download-file') {
      try {
        const item = await repository.get('files', id);
        if (!item?.blob) throw new Error('El archivo ya no está disponible.');
        const url = URL.createObjectURL(item.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.fileName || item.title;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.error('No se pudo descargar el archivo.', error);
        showToast(error.message || 'No se pudo descargar el archivo.', true);
      }
      return;
    }

    if (!isAdmin()) return;
    try {
      const isNews = action.endsWith('-news');
      const storeName = isNews ? 'news' : 'files';
      const item = await repository.get(storeName, id);
      if (!item) throw new Error('El elemento ya no existe.');

      if (action.startsWith('edit-')) {
        if (isNews) {
          editingNewsId = id;
          newsForm.elements.namedItem('title').value = item.title;
          newsForm.elements.namedItem('description').value = item.description;
          newsForm.elements.namedItem('socialUrl').value = item.socialUrl || '';
          newsForm.elements.namedItem('externalLinks').value = item.externalLinks?.join('\n') || '';
          if (newsFormTitle) newsFormTitle.textContent = 'Editar noticia';
          if (newsSubmitButton) newsSubmitButton.textContent = 'Guardar cambios';
          if (newsMessage) newsMessage.textContent = '';
          newsDialog?.showModal();
        } else {
          editingFileId = id;
          fileForm.elements.namedItem('title').value = item.title;
          fileForm.elements.namedItem('description').value = item.description || '';
          fileForm.elements.namedItem('category').value = item.category;
          if (sharedFileInput) sharedFileInput.required = false;
          if (fileFormTitle) fileFormTitle.textContent = 'Editar archivo';
          if (fileSubmitButton) fileSubmitButton.textContent = 'Guardar cambios';
          if (fileMessage) fileMessage.textContent = '';
          fileDialog?.showModal();
        }
        return;
      }

      const label = isNews ? `la noticia «${item.title}»` : `el archivo «${item.title}»`;
      if (!window.confirm(`¿Seguro que deseas eliminar ${label}? Esta acción no se puede deshacer.`)) return;
      await repository.remove(storeName, id);
      await renderAll();
      showToast(isNews ? 'Noticia eliminada.' : 'Archivo eliminado.');
    } catch (error) {
      console.error('No se pudo completar la acción solicitada.', error);
      showToast(error.message || 'No se pudo completar la acción.', true);
    }
  }

  newsFeed?.addEventListener('click', handleCommunityAction);
  newsFeed?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-news-description-toggle]');
    if (!button) return;
    const description = button.previousElementSibling;
    if (!description?.classList.contains('news-card-description')) return;
    const isExpanded = description.classList.toggle('is-expanded');
    button.setAttribute('aria-expanded', String(isExpanded));
    button.textContent = isExpanded ? 'Ver menos' : 'Ver más';
  });
  newsPreviousButton?.addEventListener('click', () => showNewsSlide(currentNewsPage - 1));
  newsNextButton?.addEventListener('click', () => showNewsSlide(currentNewsPage + 1));
  newsCarouselDots?.addEventListener('click', (event) => {
    const dot = event.target.closest('button[data-news-page]');
    if (dot) showNewsSlide(Number(dot.dataset.newsPage));
  });
  newsCarouselMobileQuery.addEventListener('change', () => renderNewsCarouselControls());
  filesList?.addEventListener('click', handleCommunityAction);
  filesList?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-file-description-toggle]');
    if (!button) return;
    const description = button.previousElementSibling;
    if (!description?.classList.contains('file-card-description')) return;
    const isExpanded = description.classList.toggle('is-expanded');
    button.setAttribute('aria-expanded', String(isExpanded));
    button.textContent = isExpanded ? 'Ver menos' : 'Ver más';
  });
  function refreshFilesList() {
    renderFiles().catch((error) => {
      console.error('No se pudo actualizar la lista de archivos.', error);
      showToast(error.message || 'No se pudo actualizar la lista de archivos.', true);
    });
  }
  fileSearchInput?.addEventListener('input', () => {
    window.clearTimeout(fileSearchTimeout);
    fileSearchTimeout = window.setTimeout(refreshFilesList, 140);
  });
  fileCategoryFilter?.addEventListener('change', refreshFilesList);
  fileSortFilter?.addEventListener('change', refreshFilesList);

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });

  [loginDialog, newsDialog, fileDialog].forEach((dialog) => {
    dialog?.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  newsDialog?.addEventListener('close', resetNewsForm);
  fileDialog?.addEventListener('close', resetFileForm);

  updateAuthControls();
  renderAll();
})();
