const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const revealItems = document.querySelectorAll('.reveal');
const yearNode = document.getElementById('year');
const contactForm = document.getElementById('contact-form');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
    });
  });
}

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

if (slideCards.length) {
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
    `Hola ATPP, mi nombre es ${name}. Estoy interesado en ${area}. ${message}. Mi celular es ${phone}.`
  );

  window.open(`https://wa.me/51987654321?text=${whatsappText}`, '_blank');

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    contactForm.reset();
  }, 1800);
});
