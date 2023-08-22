import {
  createEl,
} from '../../scripts/scripts.js';

export default async function decorate(blockEl) {
  const formBody = `
    <div class="form-row">
      <div class="field">
        <input id="firstname" name="firstname" type="text" placeholder="First Name" required="true"/>
      </div>
      <div class="field">
        <input id="lastname" name="lastname" type="text" placeholder="Last Name" required="true"/>
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <input id="organization" name="organization" type="text" placeholder="Organization" required="true"/>
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <input id="email" name="emailAddress" type="email" placeholder="Email Address" required="true"/>
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <textarea id="message" name="message" placeholder="Message"></textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <button>send</button>
      </div>
    </div>
    <input type="hidden" value="/contact/contactform" name="resourcePage" disabled="disabled">
  `;
  const formEl = createEl('form', {
    method: 'POST',
    action: 'https://spectrumsmartcities.com/bin/spectrum/smartcities/contactForm',
  }, formBody, blockEl);

  const submitButtonEl = formEl.querySelector('button');
  const emailRegex = /^[A-Za-z0-9_!#$%&'*+/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/;

  async function validateAndSubmit() {
    const formEls = formEl.querySelectorAll('input, textarea');
    const errorEls = formEl.querySelectorAll('.error-message');
    errorEls.forEach((errorEl) => errorEl.remove());
    let isValid = true;
    formEls.forEach((inputEl) => {
      inputEl.classList.remove('error');
      const { value } = inputEl;
      const fieldEl = inputEl.closest('.field');
      if (inputEl.required) {
        if (!value) {
          isValid = false;
          inputEl.classList.add('error');
          createEl('div', {
            class: 'error-message',
          }, `${inputEl.placeholder} is required`, fieldEl);
        }
      }
      if (inputEl.type === 'email' && !emailRegex.test(value) && !inputEl.classList.contains('error')) {
        isValid = false;
        inputEl.classList.add('error');
        createEl('div', {
          class: 'error-message',
        }, 'This must be a valid Email', fieldEl);
      }
    });
    if (isValid) {
      const body = new FormData(formEl);
      const resp = await fetch(formEl.action, {
        method: 'POST',
        body,
      });
      if (resp.ok) {
        submitButtonEl.textContent = 'SENT SUCCESSFULLY';
      }
    }
  }

  submitButtonEl.addEventListener('click', (e) => {
    e.preventDefault();
    validateAndSubmit();
  });
}
