/**
 * Helper validation rules for Authentication endpoints
 */
const validateRegisterInput = (name, email, password) => {
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.name = 'Please provide a valid name.';
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.email = 'Please provide an email address.';
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Please provide a password.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
};

const validateLoginInput = (email, password) => {
  const errors = {};

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.email = 'Please provide your email address.';
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.password = 'Please provide your password.';
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
