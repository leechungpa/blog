
(function () {
  document.querySelectorAll('img[data-embedded-image]').forEach(function (image) {
    var source = document.getElementById(image.dataset.embeddedImage);
    if (source) image.src = source.getAttribute('src');
  });
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({block: 'start'});
  });
})();
