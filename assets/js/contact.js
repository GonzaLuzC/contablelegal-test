(function () {
  'use strict';

  var form = document.querySelector('[data-contact-form]');
  if (!form) return;

  var statusEl  = form.querySelector('.form-status');
  var submitBtn = form.querySelector('[data-submit]') || form.querySelector('[type="submit"]');
  var endpoint  = form.getAttribute('action') || './api/contact.php';
  var originalBtnText = submitBtn ? submitBtn.textContent : 'Enviar';

  var MSG = {
    sending: 'Enviando tu mensaje…',
    success: '¡Gracias! Recibimos tu mensaje y te contactaremos a la brevedad.',
    error:   'No pudimos enviar tu mensaje. Probá de nuevo en unos minutos o escribinos por WhatsApp.',
    invalid: 'Revisá los campos marcados e intentá otra vez.',
    fields: {
      nombre:   'Ingresá tu nombre.',
      email:    'Ingresá un email válido.',
      telefono: 'Ingresá solo números.',
      mensaje:  'Escribí tu mensaje.'
    }
  };

  function setStatus(type, text) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = 'form-status form-status--' + type;
    statusEl.textContent = text;
  }

  function clearStatus() {
    if (statusEl) {
      statusEl.hidden = true;
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    }
    form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
  }

  function markFieldError(name) {
    var input = form.querySelector('[name="' + name + '"]');
    if (input) input.classList.add('has-error');
    var slot = form.querySelector('[data-error-for="' + name + '"]');
    if (slot) slot.textContent = MSG.fields[name] || 'Campo inválido.';
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Enviando…' : originalBtnText;
    form.classList.toggle('is-sending', isLoading);
  }

  function clientValidate(data) {
    var errs = [];
    if (!String(data.get('nombre') || '').trim()) errs.push('nombre');
    var email = String(data.get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('email');
    var telefono = String(data.get('telefono') || '').trim();
    if (!telefono || !/^\d+$/.test(telefono)) errs.push('telefono');
    if (!String(data.get('mensaje') || '').trim()) errs.push('mensaje');
    return errs;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();

    var data = new FormData(form);

    var clientErrs = clientValidate(data);
    if (clientErrs.length) {
      clientErrs.forEach(markFieldError);
      setStatus('error', MSG.invalid);
      return;
    }

    setLoading(true);
    setStatus('info', MSG.sending);

    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { 'X-Requested-With': 'fetch' }
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (payload) {
          return { res: res, payload: payload };
        });
      })
      .then(function (out) {
        var res = out.res, payload = out.payload;

        if (res.ok && payload.ok) {
          form.reset();
          setStatus('success', MSG.success);
          if (statusEl && typeof statusEl.scrollIntoView === 'function') {
            statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (res.status === 422 && Array.isArray(payload.campos)) {
          payload.campos.forEach(markFieldError);
          setStatus('error', MSG.invalid);
        } else {
          setStatus('error', MSG.error);
        }
      })
      .catch(function () {
        setStatus('error', MSG.error);
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
