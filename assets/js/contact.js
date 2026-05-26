(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('[data-contact-form]');
    forms.forEach(function (form) {
      form.addEventListener('submit', handleSubmit);
    });
  });

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var submitBtn = form.querySelector('[data-submit]');
    var statusEl = form.querySelector('.form-status');

    // Clear previous errors
    clearErrors(form);

    // Show sending state
    setStatus(statusEl, 'Enviando...', 'info');
    if (submitBtn) submitBtn.disabled = true;

    var data = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: data
    })
      .then(function (res) {
        return res.json().then(function (json) {
          return { ok: res.ok, status: res.status, json: json };
        });
      })
      .then(function (result) {
        if (result.ok && result.json.ok) {
          setStatus(statusEl, 'Tu mensaje fue enviado. ¡Nos pondremos en contacto pronto!', 'success');
          form.reset();
        } else if (result.status === 422 && result.json.campos) {
          setStatus(statusEl, 'Por favor corregí los errores indicados.', 'error');
          result.json.campos.forEach(function (campo) {
            showFieldError(form, campo.campo, campo.mensaje);
          });
        } else {
          setStatus(statusEl, result.json.mensaje || 'Ocurrió un error. Por favor intentá nuevamente.', 'error');
        }
      })
      .catch(function () {
        setStatus(statusEl, 'Error de conexión. Por favor intentá nuevamente.', 'error');
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  }

  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'form-status form-status--' + type;
    el.removeAttribute('hidden');
  }

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(function (el) {
      el.textContent = '';
    });
    form.querySelectorAll('.has-error').forEach(function (el) {
      el.classList.remove('has-error');
    });
    var statusEl = form.querySelector('.form-status');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.setAttribute('hidden', '');
      statusEl.className = 'form-status';
    }
  }

  function showFieldError(form, campo, mensaje) {
    var errorEl = form.querySelector('[data-error-for="' + campo + '"]');
    if (errorEl) errorEl.textContent = mensaje;
    var inputEl = form.querySelector('[name="' + campo + '"]');
    if (inputEl) inputEl.classList.add('has-error');
  }
})();
